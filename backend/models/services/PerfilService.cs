using System.Text.RegularExpressions;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public class PerfilService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly EmailService _email;
    private readonly ILogger<PerfilService> _logger;

    private const int FotoMaxBytes = 256 * 1024;
    private const string AdminTable = "AdminPerfis";

    public PerfilService(AppDbContext context, IConfiguration config, EmailService email, ILogger<PerfilService> logger)
    {
        _context = context;
        _config = config;
        _email = email;
        _logger = logger;
    }

    /// <summary>Cria <c>AdminPerfis</c> se faltar e devolve se a API pode consultar essa tabela.</summary>
    public async Task<bool> EnsureAdminPerfisTableReadyAsync(CancellationToken ct = default)
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync($@"
CREATE TABLE IF NOT EXISTS ""{AdminTable}"" (
  ""Id""            SERIAL PRIMARY KEY,
  ""Usuario""       VARCHAR(80) NOT NULL UNIQUE,
  ""Email""         VARCHAR(320) NULL,
  ""Senha""         VARCHAR(500) NOT NULL,
  ""FotoBytes""     BYTEA NULL,
  ""FotoMimeType""  VARCHAR(64) NULL,
  ""AtualizadoEm""  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);", ct);

            // Confirma que EF consegue ler a tabela (evita 500 em GET /api/Perfil/me).
            await _context.AdminPerfis.AsNoTracking().CountAsync(ct);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Não foi possível garantir a tabela {Table}.", AdminTable);
            return false;
        }
    }

    public async Task<PerfilAdminDto?> ObterAdminAsync(CancellationToken ct = default)
    {
        if (!await EnsureAdminPerfisTableReadyAsync(ct))
            return null;

        var a = await _context.AdminPerfis.AsNoTracking().OrderBy(x => x.Id).FirstOrDefaultAsync(ct);
        if (a is not null)
        {
            string? fotoDataUrl = null;
            if (a.FotoBytes is { Length: > 0 } bytes && !string.IsNullOrEmpty(a.FotoMimeType))
                fotoDataUrl = $"data:{a.FotoMimeType};base64,{Convert.ToBase64String(bytes)}";

            return new PerfilAdminDto(a.Usuario, a.Email, fotoDataUrl);
        }

        // Sem linha (ou tabela ainda não ficou pronta): mesmos dados que appsettings / primeiro login
        // (PUT cria a linha; UI do dashboard fica editável como no colaborador).
        var u = (_config["Admin:Usuario"] ?? "admin").Trim();
        if (string.IsNullOrEmpty(u)) u = "admin";
        var e = (_config["Admin:Email"] ?? "").Trim();
        return new PerfilAdminDto(u, string.IsNullOrEmpty(e) ? null : e, null);
    }

    public async Task<(bool Ok, string? Erro)> AtualizarAdminAsync(
        AtualizarPerfilAdminDto dto,
        CancellationToken ct = default)
    {
        if (!await EnsureAdminPerfisTableReadyAsync(ct))
            return (false, "Não foi possível preparar a tabela de perfil do admin nesta base de dados. Verifique permissões do utilizador da BD e reinicie a API.");

        var a = await _context.AdminPerfis.OrderBy(x => x.Id).FirstOrDefaultAsync(ct);
        if (a is null)
        {
            a = new AdminPerfil
            {
                Usuario = (_config["Admin:Usuario"] ?? "admin").Trim(),
                Email = (_config["Admin:Email"] ?? "").Trim(),
                Senha = _config["Admin:Senha"] ?? "",
                AtualizadoEm = DateTime.UtcNow,
            };
            _context.AdminPerfis.Add(a);
        }

        var novoUsuario = dto.Usuario is null ? a.Usuario : dto.Usuario.Trim();
        if (string.IsNullOrWhiteSpace(novoUsuario))
            novoUsuario = a.Usuario;
        else if (!Regex.IsMatch(novoUsuario, @"^[a-zA-Z0-9._-]{2,80}$"))
            return (false, "Utilize 2–80 caracteres: letras, números, ponto, _ ou -.");

        var novoEmail = dto.Email is null ? a.Email : dto.Email.Trim();
        if (string.IsNullOrWhiteSpace(novoEmail))
            novoEmail = null;

        var querTrocarSenha = !string.IsNullOrWhiteSpace(dto.NovaSenha);
        if (querTrocarSenha)
        {
            if (string.IsNullOrWhiteSpace(dto.SenhaAtual))
                return (false, "Informe a senha atual para definir uma nova.");
            if (dto.NovaSenha != dto.ConfirmarSenha)
                return (false, "Nova senha e confirmação não coincidem.");
            if (dto.NovaSenha!.Length < 6)
                return (false, "A nova senha deve ter pelo menos 6 caracteres.");
            if (!string.Equals(a.Senha, dto.SenhaAtual, StringComparison.Ordinal))
                return (false, "Senha atual incorreta.");
            a.Senha = dto.NovaSenha!;
        }

        if (dto.RemoverFoto)
        {
            a.FotoBytes = null;
            a.FotoMimeType = null;
        }
        else if (!string.IsNullOrWhiteSpace(dto.FotoBase64))
        {
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(dto.FotoBase64!.Trim());
            }
            catch
            {
                return (false, "Imagem inválida.");
            }

            if (bytes.Length > FotoMaxBytes)
                return (false, $"Foto demasiado grande (máx. {FotoMaxBytes / 1024} KB).");

            var mime = (dto.FotoMimeType ?? "").ToLowerInvariant().Trim();
            if (mime is not ("image/jpeg" or "image/png" or "image/webp"))
                return (false, "Use JPEG, PNG ou WebP.");

            a.FotoBytes = bytes;
            a.FotoMimeType = mime;
        }

        a.Usuario = novoUsuario;
        a.Email = novoEmail;
        a.AtualizadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<PerfilColaboradorDto?> ObterColaboradorAsync(int id, CancellationToken ct = default)
    {
        var c = await _context.Colaboradores.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return null;

        string? fotoDataUrl = null;
        if (c.FotoBytes is { Length: > 0 } bytes && !string.IsNullOrEmpty(c.FotoMimeType))
            fotoDataUrl = $"data:{c.FotoMimeType};base64,{Convert.ToBase64String(bytes)}";

        return new PerfilColaboradorDto(
            Email: c.Email,
            Usuario: c.Usuario,
            FotoDataUrl: fotoDataUrl,
            AcessoAdministrador: c.AcessoAdministrador);
    }

    public async Task<(bool Ok, string? Erro)> AtualizarColaboradorAsync(
        int id,
        AtualizarPerfilColaboradorDto dto,
        CancellationToken ct = default)
    {
        var col = await _context.Colaboradores.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (col is null) return (false, "Colaborador não encontrado.");

        var adminUser = (_config["Admin:Usuario"] ?? "").Trim();
        var adminEmail = (_config["Admin:Email"] ?? "").Trim();

        string? novoUsuario = dto.Usuario is null ? col.Usuario : dto.Usuario.Trim();
        if (string.IsNullOrWhiteSpace(novoUsuario))
            novoUsuario = null;
        else if (!Regex.IsMatch(novoUsuario, @"^[a-zA-Z0-9._-]{2,80}$"))
            return (false, "Utilize 2–80 caracteres: letras, números, ponto, _ ou -.");

        if (novoUsuario is not null &&
            string.Equals(novoUsuario, adminUser, StringComparison.OrdinalIgnoreCase))
            return (false, "Este nome de utilizador já está reservado.");

        if (novoUsuario is not null &&
            !string.IsNullOrEmpty(adminEmail) &&
            string.Equals(novoUsuario, adminEmail, StringComparison.OrdinalIgnoreCase))
            return (false, "Este nome de utilizador já está reservado.");

        if (novoUsuario is not null)
        {
            var nl = novoUsuario.ToLowerInvariant();
            var existeOutro = await _context.Colaboradores.AsNoTracking()
                .AnyAsync(c => c.Id != id && c.Usuario != null && c.Usuario.ToLower() == nl, ct);
            if (existeOutro)
                return (false, "Este nome de utilizador já está em uso.");
        }

        var usuarioAlterado = !string.Equals(col.Usuario ?? "", novoUsuario ?? "", StringComparison.Ordinal);
        col.Usuario = novoUsuario;

        var querTrocarSenha = !string.IsNullOrWhiteSpace(dto.NovaSenha);
        if (querTrocarSenha)
        {
            if (string.IsNullOrWhiteSpace(dto.SenhaAtual))
                return (false, "Informe a senha atual para definir uma nova.");

            if (dto.NovaSenha != dto.ConfirmarSenha)
                return (false, "Nova senha e confirmação não coincidem.");

            if (dto.NovaSenha!.Length < 6)
                return (false, "A nova senha deve ter pelo menos 6 caracteres.");

            if (col.Senha != dto.SenhaAtual)
                return (false, "Senha atual incorreta.");

            col.Senha = dto.NovaSenha!;
        }

        if (dto.RemoverFoto)
        {
            col.FotoBytes = null;
            col.FotoMimeType = null;
        }
        else if (!string.IsNullOrWhiteSpace(dto.FotoBase64))
        {
            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(dto.FotoBase64!.Trim());
            }
            catch
            {
                return (false, "Imagem inválida.");
            }

            if (bytes.Length > FotoMaxBytes)
                return (false, $"Foto demasiado grande (máx. {FotoMaxBytes / 1024} KB).");

            var mime = (dto.FotoMimeType ?? "").ToLowerInvariant().Trim();
            if (mime is not ("image/jpeg" or "image/png" or "image/webp"))
                return (false, "Use JPEG, PNG ou WebP.");

            col.FotoBytes = bytes;
            col.FotoMimeType = mime;
        }

        await _context.SaveChangesAsync(ct);

        try
        {
            if (usuarioAlterado)
                await _email.NotificarAlteracaoUsuarioAsync(col.Email, col.Usuario ?? col.Email);
            if (querTrocarSenha)
                await _email.NotificarAlteracaoSenhaAsync(col.Email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Perfil guardado mas falhou envio de e-mail para {Email}", col.Email);
        }

        return (true, null);
    }
}

public record PerfilColaboradorDto(string Email, string? Usuario, string? FotoDataUrl, bool AcessoAdministrador);

public record PerfilAdminDto(string Usuario, string? Email, string? FotoDataUrl);

public record AtualizarPerfilColaboradorDto(
    string? Usuario,
    string? SenhaAtual,
    string? NovaSenha,
    string? ConfirmarSenha,
    bool RemoverFoto,
    string? FotoBase64,
    string? FotoMimeType);

public record AtualizarPerfilAdminDto(
    string? Usuario,
    string? Email,
    string? SenhaAtual,
    string? NovaSenha,
    string? ConfirmarSenha,
    bool RemoverFoto,
    string? FotoBase64,
    string? FotoMimeType);
