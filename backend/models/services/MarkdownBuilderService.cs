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
    /// <summary>novo | atualizar | despublicar | republicar | excluir. Legacy: use Compartilhado.</summary>
    public string? Acao { get; set; }
    public int? TemplateId { get; set; }
    public string? TituloModelo { get; set; }
    public string? Descricao { get; set; }
    /// <summary>Markdown revisto pelo autor no modal "Preparar modelo". O servidor ainda aplica scrub de PII.</summary>
    public string? ConteudoMarkdown { get; set; }
    /// <summary>Compat: true = publicar novo; false = despublicar TemplateId (ou o mais recente).</summary>
    public bool? Compartilhado { get; set; }
}

public sealed class MarkdownTemplateStatusRequest
{
    public bool Ativo { get; set; }
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

        return (true, null, new { doc = MapDoc(doc), awards, word_count = words, heading_count = headings });
    }

    public async Task<object> GetShareStateAsync(int userId, CancellationToken ct = default)
    {
        var mine = await _db.MarkdownSharedTemplates.AsNoTracking()
            .Where(x => x.OwnerUserId == userId)
            .OrderByDescending(x => x.AtualizadoEm)
            .Select(x => new { x.Id, x.Ativo, x.AtualizadoEm })
            .ToListAsync(ct);
        var published = mine.Count(x => x.Ativo);
        return new
        {
            compartilhado = published > 0,
            published_count = published,
            total_count = mine.Count,
            template_id = mine.FirstOrDefault(x => x.Ativo)?.Id,
            atualizado_em = mine.FirstOrDefault()?.AtualizadoEm,
        };
    }

    public async Task<object> ListMyTemplatesAsync(int userId, CancellationToken ct = default)
    {
        var rows = await _db.MarkdownSharedTemplates.AsNoTracking()
            .Where(t => t.OwnerUserId == userId)
            .OrderByDescending(t => t.AtualizadoEm)
            .ToListAsync(ct);
        return rows.Select(t => new
        {
            id = t.Id,
            titulo = t.TituloModelo,
            descricao = t.Descricao,
            ativo = t.Ativo,
            preview = MarkdownTemplateAnonymizer.BuildCardPreview(t.Descricao, t.ConteudoMarkdown),
            usos = t.UsosCount,
            criado_em = t.CriadoEm,
            atualizado_em = t.AtualizadoEm,
        }).ToList();
    }

    public async Task<object?> PreviewAnonymizeAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.MarkdownBuilderUsers
            .Include(u => u.Document)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user?.Document is null || string.IsNullOrWhiteSpace(user.Document.ConteudoMarkdown))
            return null;

        var (markdown, replacements) = MarkdownTemplateAnonymizer.Anonymize(
            user.Document.ConteudoMarkdown,
            user.Usuario,
            user.Nome);

        return new
        {
            titulo_sugerido = Clamp(user.Document.Titulo, 120, "Modelo README"),
            markdown,
            replacements,
            original_markdown = user.Document.ConteudoMarkdown,
        };
    }

    public async Task<(bool Ok, string? Error, object? Payload)> SetShareAsync(
        int userId,
        MarkdownShareRequest req,
        CancellationToken ct = default)
    {
        var acao = (req.Acao ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(acao))
        {
            if (req.Compartilhado == true) acao = "novo";
            else if (req.Compartilhado == false) acao = "despublicar";
            else acao = "novo";
        }

        return acao switch
        {
            "novo" or "publicar" => await PublishNewTemplateAsync(userId, req, ct),
            "atualizar" => await UpdateMyTemplateAsync(userId, req.TemplateId, req, ct),
            "despublicar" => await SetMyTemplateActiveAsync(userId, req.TemplateId, false, ct),
            "republicar" => await SetMyTemplateActiveAsync(userId, req.TemplateId, true, ct),
            "excluir" => await DeleteMyTemplateAsync(userId, req.TemplateId, ct),
            _ => (false, "Ação inválida. Use: novo, atualizar, despublicar, republicar, excluir.", null),
        };
    }

    public async Task<(bool Ok, string? Error, object? Payload)> PublishNewTemplateAsync(
        int userId,
        MarkdownShareRequest req,
        CancellationToken ct = default)
    {
        var user = await _db.MarkdownBuilderUsers
            .Include(u => u.Document)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return (false, "user_not_found", null);

        var doc = user.Document;
        if (doc is null || string.IsNullOrWhiteSpace(doc.ConteudoMarkdown))
            return (false, "Escreve algum markdown antes de partilhar o modelo.", null);

        var titleRaw = string.IsNullOrWhiteSpace(req.TituloModelo) ? doc.Titulo : req.TituloModelo!;
        var titulo = Clamp(titleRaw.Trim(), 120, "Modelo README");
        if (string.IsNullOrWhiteSpace(titulo))
            return (false, "Indica um título para o modelo.", null);

        var titleTaken = await _db.MarkdownSharedTemplates.AsNoTracking()
            .AnyAsync(t => t.OwnerUserId == userId && t.TituloModelo.ToLower() == titulo.ToLower(), ct);
        if (titleTaken)
            return (false, "Já tens um modelo com este título. Escolhe outro ou atualiza o existente.", null);

        var markdown = MarkdownTemplateAnonymizer.ApplyReviewedMarkdown(
            doc.ConteudoMarkdown,
            req.ConteudoMarkdown,
            user.Usuario,
            user.Nome);
        if (string.IsNullOrWhiteSpace(markdown))
            return (false, "Depois da sanitização o modelo ficou vazio.", null);

        var entity = new MarkdownSharedTemplate
        {
            OwnerUserId = userId,
            TituloModelo = titulo,
            Descricao = Truncate((req.Descricao ?? string.Empty).Trim(), 280),
            ConteudoMarkdown = Clamp(markdown, 200_000, string.Empty),
            Ativo = true,
            UsosCount = 0,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow,
        };
        _db.MarkdownSharedTemplates.Add(entity);
        await _db.SaveChangesAsync(ct);

        return (true, null, MapTemplateOwner(entity));
    }

    public async Task<(bool Ok, string? Error, object? Payload)> UpdateMyTemplateAsync(
        int userId,
        int? templateId,
        MarkdownShareRequest req,
        CancellationToken ct = default)
    {
        if (templateId is null or <= 0)
            return (false, "Indica o template_id a atualizar.", null);

        var user = await _db.MarkdownBuilderUsers
            .Include(u => u.Document)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return (false, "user_not_found", null);

        var existing = await _db.MarkdownSharedTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.OwnerUserId == userId, ct);
        if (existing is null) return (false, "Modelo não encontrado ou sem permissão.", null);

        var doc = user.Document;
        if (doc is null || string.IsNullOrWhiteSpace(doc.ConteudoMarkdown))
            return (false, "Escreve algum markdown antes de atualizar o modelo.", null);

        var titleRaw = string.IsNullOrWhiteSpace(req.TituloModelo) ? doc.Titulo : req.TituloModelo!;
        var titulo = Clamp(titleRaw.Trim(), 120, "Modelo README");
        var titleTaken = await _db.MarkdownSharedTemplates.AsNoTracking()
            .AnyAsync(t => t.OwnerUserId == userId && t.Id != existing.Id && t.TituloModelo.ToLower() == titulo.ToLower(), ct);
        if (titleTaken)
            return (false, "Já tens outro modelo com este título. Escolhe um título diferente.", null);

        var markdown = MarkdownTemplateAnonymizer.ApplyReviewedMarkdown(
            doc.ConteudoMarkdown,
            req.ConteudoMarkdown,
            user.Usuario,
            user.Nome);
        if (string.IsNullOrWhiteSpace(markdown))
            return (false, "Depois da sanitização o modelo ficou vazio.", null);

        existing.TituloModelo = titulo;
        if (req.Descricao is not null)
            existing.Descricao = Truncate(req.Descricao.Trim(), 280);
        existing.ConteudoMarkdown = Clamp(markdown, 200_000, string.Empty);
        existing.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return (true, null, MapTemplateOwner(existing));
    }

    public async Task<(bool Ok, string? Error, object? Payload)> SetMyTemplateActiveAsync(
        int userId,
        int? templateId,
        bool ativo,
        CancellationToken ct = default)
    {
        MarkdownSharedTemplate? existing;
        if (templateId is > 0)
        {
            existing = await _db.MarkdownSharedTemplates
                .FirstOrDefaultAsync(t => t.Id == templateId && t.OwnerUserId == userId, ct);
        }
        else
        {
            // Legacy: despublicar o mais recente ativo
            existing = await _db.MarkdownSharedTemplates
                .Where(t => t.OwnerUserId == userId && t.Ativo)
                .OrderByDescending(t => t.AtualizadoEm)
                .FirstOrDefaultAsync(ct);
        }

        if (existing is null) return (false, "Modelo não encontrado ou sem permissão.", null);

        existing.Ativo = ativo;
        existing.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return (true, null, MapTemplateOwner(existing));
    }

    public async Task<(bool Ok, string? Error, object? Payload)> DeleteMyTemplateAsync(
        int userId,
        int? templateId,
        CancellationToken ct = default)
    {
        if (templateId is null or <= 0)
            return (false, "Indica o template_id a excluir.", null);

        var existing = await _db.MarkdownSharedTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId && t.OwnerUserId == userId, ct);
        if (existing is null) return (false, "Modelo não encontrado ou sem permissão.", null);

        _db.MarkdownSharedTemplates.Remove(existing);
        await _db.SaveChangesAsync(ct);
        return (true, null, new { deleted = true, template_id = templateId });
    }

    public async Task<object?> GetMyTemplateAsync(int userId, int id, CancellationToken ct = default)
    {
        var t = await _db.MarkdownSharedTemplates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OwnerUserId == userId, ct);
        return t is null ? null : MapTemplateOwnerFull(t);
    }

    public async Task<object> ListTemplatesAsync(CancellationToken ct = default)
    {
        var rows = await _db.MarkdownSharedTemplates.AsNoTracking()
            .Where(t => t.Ativo)
            .OrderByDescending(t => t.AtualizadoEm)
            .Take(100)
            .ToListAsync(ct);
        return rows.Select(t => new
        {
            id = t.Id,
            titulo = t.TituloModelo,
            descricao = t.Descricao,
            preview = MarkdownTemplateAnonymizer.BuildCardPreview(t.Descricao, t.ConteudoMarkdown),
            usos = t.UsosCount,
            atualizado_em = t.AtualizadoEm,
            criado_em = t.CriadoEm,
        }).ToList();
    }

    public async Task<object?> GetTemplateAsync(int id, CancellationToken ct = default)
    {
        var t = await _db.MarkdownSharedTemplates
            .FirstOrDefaultAsync(x => x.Id == id && x.Ativo, ct);
        if (t is null) return null;
        t.UsosCount += 1;
        await _db.SaveChangesAsync(ct);
        return new
        {
            id = t.Id,
            titulo = t.TituloModelo,
            descricao = t.Descricao,
            conteudo_markdown = t.ConteudoMarkdown,
            usos = t.UsosCount,
            atualizado_em = t.AtualizadoEm,
        };
    }

    private static object MapTemplateOwner(MarkdownSharedTemplate t) => new
    {
        compartilhado = t.Ativo,
        template_id = t.Id,
        titulo = t.TituloModelo,
        descricao = t.Descricao,
        ativo = t.Ativo,
        usos = t.UsosCount,
        atualizado_em = t.AtualizadoEm,
    };

    private static object MapTemplateOwnerFull(MarkdownSharedTemplate t) => new
    {
        id = t.Id,
        titulo = t.TituloModelo,
        descricao = t.Descricao,
        conteudo_markdown = t.ConteudoMarkdown,
        ativo = t.Ativo,
        criado_em = t.CriadoEm,
        atualizado_em = t.AtualizadoEm,
    };

    private static string Truncate(string s, int max) =>
        string.IsNullOrEmpty(s) ? string.Empty : (s.Length <= max ? s : s[..max]);

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
