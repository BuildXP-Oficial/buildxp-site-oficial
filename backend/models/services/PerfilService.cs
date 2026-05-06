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

    public PerfilService(AppDbContext context, IConfiguration config, EmailService email, ILogger<PerfilService> logger)
    {
        _context = context;
        _config = config;
        _email = email;
        _logger = logger;
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
            FotoDataUrl: fotoDataUrl);
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

public record PerfilColaboradorDto(string Email, string? Usuario, string? FotoDataUrl);

public record AtualizarPerfilColaboradorDto(
    string? Usuario,
    string? SenhaAtual,
    string? NovaSenha,
    string? ConfirmarSenha,
    bool RemoverFoto,
    string? FotoBase64,
    string? FotoMimeType);
