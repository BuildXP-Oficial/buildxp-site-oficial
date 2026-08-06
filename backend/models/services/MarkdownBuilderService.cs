using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BuildXP.API.Services;

public static class MarkdownSecurityQuestions
{
    public static readonly IReadOnlyList<(int Id, string Text)> All =
    [
        (0, "Qual seria o código secreto da sua base lunar imaginária?"),
        (1, "Em que século fictício você teria fundado a sua primeira startup?"),
        (2, "Qual era o nome do protocolo inventado no seu primeiro «sistema operacional» de brincadeira?"),
        (3, "Qual cor inexistente você usaria como tema do seu primeiro IDE?"),
        (4, "Qual seria a palavra-passe do cofre do museu que só existe na sua cabeça?"),
        (5, "Qual era o callsign da sua nave espacial inventada aos 10 anos?"),
    ];

    public static bool IsValidId(int id) => id >= 0 && id < All.Count;
}

public sealed class MarkdownRegisterRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public int SecurityQuestionId { get; set; }
    public string SecurityAnswer { get; set; } = string.Empty;
}

public sealed class MarkdownLoginRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}

public sealed class MarkdownRecoverRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string SecurityAnswer { get; set; } = string.Empty;
    public string NovaSenha { get; set; } = string.Empty;
}

public sealed class MarkdownDocSaveRequest
{
    public string? Titulo { get; set; }
    public string? ConteudoMarkdown { get; set; }
    public string? Pitch { get; set; }
    public string? Arquitetura { get; set; }
    public string? RegrasEvento { get; set; }
}

public sealed class MarkdownShareRequest
{
    public bool Compartilhado { get; set; }
}

public sealed class MarkdownXpAwardDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Points { get; set; }
}

public class MarkdownBuilderService
{
    public const string JwtRole = "markdown";
    public const int XpDocCriadaPts = 30;
    public const int XpProjetoAtualizadoPts = 15;
    public const int XpReadmeCompletoPts = 50;
    public const int ReadmeMinWords = 100;
    public const int ReadmeMinHeadings = 3;

    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public MarkdownBuilderService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public static string HashSecret(string raw)
    {
        var norm = (raw ?? string.Empty).Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes("buildxp-md|" + norm));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static int CountWords(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return text
            .Split([' ', '\t', '\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Length;
    }

    /// <summary>Conta títulos/subtítulos Markdown (# … ######).</summary>
    public static int CountHeadings(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        var n = 0;
        foreach (var line in text.Replace("\r\n", "\n").Split('\n'))
        {
            var t = line.TrimStart();
            if (t.Length == 0 || t[0] != '#') continue;
            var i = 0;
            while (i < t.Length && i < 6 && t[i] == '#') i++;
            if (i > 0 && i <= 6 && i < t.Length && char.IsWhiteSpace(t[i]))
                n++;
        }
        return n;
    }

    public async Task<(bool Ok, string? Error, object? Payload)> RegisterAsync(MarkdownRegisterRequest req, CancellationToken ct = default)
    {
        var usuario = (req.Usuario ?? string.Empty).Trim().ToLowerInvariant();
        var nome = (req.Nome ?? string.Empty).Trim();
        var senha = req.Senha ?? string.Empty;
        var answer = (req.SecurityAnswer ?? string.Empty).Trim();

        if (usuario.Length < 3 || usuario.Length > 40)
            return (false, "O usuário deve ter entre 3 e 40 caracteres.", null);
        if (!System.Text.RegularExpressions.Regex.IsMatch(usuario, @"^[a-z0-9._-]+$"))
            return (false, "Use só letras minúsculas, números, ponto, hífen ou underscore no usuário.", null);
        if (nome.Length < 2 || nome.Length > 80)
            return (false, "Informe um nome entre 2 e 80 caracteres.", null);
        if (senha.Length < 6 || senha.Length > 72)
            return (false, "A senha deve ter entre 6 e 72 caracteres.", null);
        if (!MarkdownSecurityQuestions.IsValidId(req.SecurityQuestionId))
            return (false, "Escolha uma pergunta de segurança válida.", null);
        if (answer.Length < 2 || answer.Length > 120)
            return (false, "A resposta de segurança deve ter entre 2 e 120 caracteres.", null);

        if (await _db.MarkdownBuilderUsers.AnyAsync(u => u.Usuario == usuario, ct))
            return (false, "user_exists", null);

        var user = new MarkdownBuilderUser
        {
            Usuario = usuario,
            Nome = nome,
            SenhaHash = HashSecret(senha),
            SecurityQuestionId = req.SecurityQuestionId,
            SecurityAnswerHash = HashSecret(answer),
            CriadoEm = DateTime.UtcNow,
            Document = new MarkdownBuilderDoc
            {
                Titulo = "Meu README",
                ConteudoMarkdown = string.Empty,
                CriadoEm = DateTime.UtcNow,
                AtualizadoEm = DateTime.UtcNow,
            },
        };

        _db.MarkdownBuilderUsers.Add(user);
        await _db.SaveChangesAsync(ct);

        var token = GerarToken(user);
        return (true, null, new
        {
            token,
            usuario = user.Usuario,
            nome = user.Nome,
            doc = MapDoc(user.Document!),
        });
    }

    public async Task<(bool Ok, string? Error, object? Payload)> LoginAsync(MarkdownLoginRequest req, CancellationToken ct = default)
    {
        var usuario = (req.Usuario ?? string.Empty).Trim().ToLowerInvariant();
        var senha = req.Senha ?? string.Empty;
        if (string.IsNullOrEmpty(usuario) || string.IsNullOrEmpty(senha))
            return (false, "Informe usuário e senha.", null);

        var user = await _db.MarkdownBuilderUsers
            .Include(u => u.Document)
            .FirstOrDefaultAsync(u => u.Usuario == usuario, ct);

        if (user is null)
            return (false, "user_not_found", null);
        if (user.SenhaHash != HashSecret(senha))
            return (false, "wrong_password", null);

        if (user.Document is null)
        {
            user.Document = new MarkdownBuilderDoc
            {
                UserId = user.Id,
                Titulo = "Meu README",
                CriadoEm = DateTime.UtcNow,
                AtualizadoEm = DateTime.UtcNow,
            };
            await _db.SaveChangesAsync(ct);
        }

        return (true, null, new
        {
            token = GerarToken(user),
            usuario = user.Usuario,
            nome = user.Nome,
            doc = MapDoc(user.Document!),
        });
    }

    public async Task<(bool Ok, string? Error)> RecoverAsync(MarkdownRecoverRequest req, CancellationToken ct = default)
    {
        var usuario = (req.Usuario ?? string.Empty).Trim().ToLowerInvariant();
        var user = await _db.MarkdownBuilderUsers.FirstOrDefaultAsync(u => u.Usuario == usuario, ct);
        if (user is null) return (false, "user_not_found");
        if (user.SecurityAnswerHash != HashSecret(req.SecurityAnswer ?? string.Empty))
            return (false, "wrong_answer");
        var nova = req.NovaSenha ?? string.Empty;
        if (nova.Length < 6 || nova.Length > 72)
            return (false, "A nova senha deve ter entre 6 e 72 caracteres.");
        user.SenhaHash = HashSecret(nova);
        await _db.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<object?> GetDocAsync(int userId, CancellationToken ct = default)
    {
        var doc = await _db.MarkdownBuilderDocs.AsNoTracking()
            .FirstOrDefaultAsync(d => d.UserId == userId, ct);
        return doc is null ? null : MapDoc(doc);
    }

    public async Task<(bool Ok, string? Error, object? Payload)> SaveDocAsync(
        int userId,
        MarkdownDocSaveRequest req,
        CancellationToken ct = default)
    {
        var doc = await _db.MarkdownBuilderDocs.FirstOrDefaultAsync(d => d.UserId == userId, ct);
        if (doc is null)
        {
            doc = new MarkdownBuilderDoc
            {
                UserId = userId,
                CriadoEm = DateTime.UtcNow,
            };
            _db.MarkdownBuilderDocs.Add(doc);
        }

        var wasEmpty = string.IsNullOrWhiteSpace(doc.ConteudoMarkdown);
        if (req.Titulo is not null)
            doc.Titulo = Clamp(req.Titulo.Trim(), 120, "Meu README");
        if (req.ConteudoMarkdown is not null)
            doc.ConteudoMarkdown = Clamp(req.ConteudoMarkdown, 200_000, string.Empty);
        if (req.Pitch is not null)
            doc.Pitch = Clamp(req.Pitch, 8_000, string.Empty);
        if (req.Arquitetura is not null)
            doc.Arquitetura = Clamp(req.Arquitetura, 8_000, string.Empty);
        if (req.RegrasEvento is not null)
            doc.RegrasEvento = Clamp(req.RegrasEvento, 8_000, string.Empty);

        doc.AtualizadoEm = DateTime.UtcNow;

        var awards = new List<MarkdownXpAwardDto>();
        var hasContent = !string.IsNullOrWhiteSpace(doc.ConteudoMarkdown);

        if (hasContent && wasEmpty && !doc.XpDocCriada)
        {
            doc.XpDocCriada = true;
            doc.XpTotal += XpDocCriadaPts;
            awards.Add(new MarkdownXpAwardDto
            {
                Code = "doc_criada",
                Label = "Documento criado",
                Points = XpDocCriadaPts,
            });
        }
        else if (hasContent && !wasEmpty && !doc.XpProjetoAtualizado)
        {
            doc.XpProjetoAtualizado = true;
            doc.XpTotal += XpProjetoAtualizadoPts;
            awards.Add(new MarkdownXpAwardDto
            {
                Code = "projeto_atualizado",
                Label = "Projeto atualizado",
                Points = XpProjetoAtualizadoPts,
            });
        }

        var words = CountWords(doc.ConteudoMarkdown);
        var headings = CountHeadings(doc.ConteudoMarkdown);
        if (words >= ReadmeMinWords && headings >= ReadmeMinHeadings && !doc.XpReadmeCompleto)
        {
            doc.XpReadmeCompleto = true;
            doc.XpTotal += XpReadmeCompletoPts;
            awards.Add(new MarkdownXpAwardDto
            {
                Code = "readme_completo",
                Label = $"README completo (≥{ReadmeMinWords} palavras e ≥{ReadmeMinHeadings} títulos)",
                Points = XpReadmeCompletoPts,
            });
        }

        await _db.SaveChangesAsync(ct);

        // Se o modelo está partilhado, atualiza o snapshot sanitizado
        await SyncSharedTemplateIfActiveAsync(userId, doc, ct);

        return (true, null, new { doc = MapDoc(doc), awards, word_count = words, heading_count = headings });
    }

    public async Task<object> GetShareStateAsync(int userId, CancellationToken ct = default)
    {
        var t = await _db.MarkdownSharedTemplates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.OwnerUserId == userId, ct);
        return new
        {
            compartilhado = t is { Ativo: true },
            template_id = t is { Ativo: true } ? t.Id : (int?)null,
            atualizado_em = t?.AtualizadoEm,
        };
    }

    public async Task<(bool Ok, string? Error, object? Payload)> SetShareAsync(
        int userId,
        MarkdownShareRequest req,
        CancellationToken ct = default)
    {
        var user = await _db.MarkdownBuilderUsers
            .Include(u => u.Document)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return (false, "user_not_found", null);

        var existing = await _db.MarkdownSharedTemplates
            .FirstOrDefaultAsync(t => t.OwnerUserId == userId, ct);

        if (!req.Compartilhado)
        {
            if (existing is not null)
            {
                existing.Ativo = false;
                existing.AtualizadoEm = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
            }
            return (true, null, new { compartilhado = false, template_id = (int?)null });
        }

        var doc = user.Document;
        if (doc is null || string.IsNullOrWhiteSpace(doc.ConteudoMarkdown))
            return (false, "Escreve algum markdown antes de partilhar o modelo.", null);

        var (titulo, markdown) = SanitizeTemplate(doc.Titulo, doc.ConteudoMarkdown, user.Usuario, user.Nome);
        if (string.IsNullOrWhiteSpace(markdown))
            return (false, "Depois da sanitização o modelo ficou vazio.", null);

        if (existing is null)
        {
            existing = new MarkdownSharedTemplate
            {
                OwnerUserId = userId,
                CriadoEm = DateTime.UtcNow,
            };
            _db.MarkdownSharedTemplates.Add(existing);
        }

        existing.TituloModelo = titulo;
        existing.ConteudoMarkdown = markdown;
        existing.Ativo = true;
        existing.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return (true, null, new
        {
            compartilhado = true,
            template_id = existing.Id,
            atualizado_em = existing.AtualizadoEm,
        });
    }

    public async Task<object> ListTemplatesAsync(CancellationToken ct = default)
    {
        var list = await _db.MarkdownSharedTemplates.AsNoTracking()
            .Where(t => t.Ativo)
            .OrderByDescending(t => t.AtualizadoEm)
            .Take(100)
            .Select(t => new
            {
                id = t.Id,
                titulo = t.TituloModelo,
                preview = t.ConteudoMarkdown.Length > 160
                    ? t.ConteudoMarkdown.Substring(0, 160) + "…"
                    : t.ConteudoMarkdown,
                atualizado_em = t.AtualizadoEm,
            })
            .ToListAsync(ct);
        return list;
    }

    public async Task<object?> GetTemplateAsync(int id, CancellationToken ct = default)
    {
        var t = await _db.MarkdownSharedTemplates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.Ativo, ct);
        if (t is null) return null;
        return new
        {
            id = t.Id,
            titulo = t.TituloModelo,
            conteudo_markdown = t.ConteudoMarkdown,
            atualizado_em = t.AtualizadoEm,
        };
    }

    private async Task SyncSharedTemplateIfActiveAsync(int userId, MarkdownBuilderDoc doc, CancellationToken ct)
    {
        var existing = await _db.MarkdownSharedTemplates
            .FirstOrDefaultAsync(t => t.OwnerUserId == userId && t.Ativo, ct);
        if (existing is null) return;

        var user = await _db.MarkdownBuilderUsers.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return;

        var (titulo, markdown) = SanitizeTemplate(doc.Titulo, doc.ConteudoMarkdown, user.Usuario, user.Nome);
        if (string.IsNullOrWhiteSpace(markdown))
        {
            existing.Ativo = false;
            existing.AtualizadoEm = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return;
        }

        existing.TituloModelo = titulo;
        existing.ConteudoMarkdown = markdown;
        existing.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Remove dados da conta do dono; mantém estrutura/temas do README.</summary>
    internal static (string Titulo, string Markdown) SanitizeTemplate(
        string? titulo,
        string? markdown,
        string usuario,
        string nome)
    {
        var userKey = (usuario ?? string.Empty).Trim();
        var nameKey = (nome ?? string.Empty).Trim();

        string Scrub(string input)
        {
            var s = input ?? string.Empty;
            if (!string.IsNullOrEmpty(nameKey) && nameKey.Length >= 2)
                s = Regex.Replace(s, Regex.Escape(nameKey), "SEU_NOME", RegexOptions.IgnoreCase);
            if (!string.IsNullOrEmpty(userKey) && userKey.Length >= 2)
            {
                s = Regex.Replace(s, Regex.Escape(userKey), "SEU_USER", RegexOptions.IgnoreCase);
                s = Regex.Replace(
                    s,
                    $@"(?i)(https?://)?(www\.)?github\.com/{Regex.Escape(userKey)}(/[^\s)\]]*)?",
                    "https://github.com/SEU_USER");
                s = Regex.Replace(
                    s,
                    $@"(?i)(https?://)?(www\.)?linkedin\.com/in/{Regex.Escape(userKey)}(/[^\s)\]]*)?",
                    "https://linkedin.com/in/SEU_USER");
            }
            return s;
        }

        var cleanTitle = Clamp(Scrub(titulo ?? string.Empty), 120, "Modelo README");
        if (string.IsNullOrWhiteSpace(cleanTitle) ||
            cleanTitle.Equals("Meu README", StringComparison.OrdinalIgnoreCase))
            cleanTitle = "Modelo README";

        var cleanMd = Clamp(Scrub(markdown ?? string.Empty), 200_000, string.Empty);
        return (cleanTitle, cleanMd);
    }

    public async Task<object?> GetSecurityQuestionForUserAsync(string usuario, CancellationToken ct = default)
    {
        var u = (usuario ?? string.Empty).Trim().ToLowerInvariant();
        var user = await _db.MarkdownBuilderUsers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Usuario == u, ct);
        if (user is null) return null;
        var q = MarkdownSecurityQuestions.All.FirstOrDefault(x => x.Id == user.SecurityQuestionId);
        return new { security_question_id = user.SecurityQuestionId, security_question = q.Text };
    }

    private string GerarToken(MarkdownBuilderUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Chave"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Nome),
            new Claim("usuario", user.Usuario),
            new Claim(ClaimTypes.Role, JwtRole),
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(14),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static object MapDoc(MarkdownBuilderDoc d) => new
    {
        id = d.Id,
        titulo = d.Titulo,
        conteudo_markdown = d.ConteudoMarkdown,
        pitch = d.Pitch,
        arquitetura = d.Arquitetura,
        regras_evento = d.RegrasEvento,
        xp_total = d.XpTotal,
        xp_doc_criada = d.XpDocCriada,
        xp_projeto_atualizado = d.XpProjetoAtualizado,
        xp_readme_completo = d.XpReadmeCompleto,
        word_count = CountWords(d.ConteudoMarkdown),
        atualizado_em = d.AtualizadoEm,
    };

    private static string Clamp(string? s, int max, string fallback)
    {
        if (string.IsNullOrEmpty(s)) return fallback;
        return s.Length <= max ? s : s[..max];
    }
}
