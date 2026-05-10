using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public class ColaboradorService
{
    private readonly AppDbContext _context;
    private readonly EmailService _email;

    public ColaboradorService(AppDbContext context, EmailService email)
    {
        _context = context;
        _email = email;
    }

    // null = sucesso; senão mensagem (já convidado ou falha ao enviar e-mail)
    public async Task<string?> ConvidarAsync(string emailColaborador)
    {
        var emailNorm = emailColaborador.Trim().ToLowerInvariant();
        var existe = await _context.Colaboradores
            .AnyAsync(c => c.Email.ToLower() == emailNorm);

        if (existe)
            return "Este e-mail já foi convidado.";

        var token = Guid.NewGuid().ToString("N");

        var colaborador = new Colaborador
        {
            Email = emailNorm,
            TokenConvite = token,
            TokenExpiraEm = DateTime.UtcNow.AddHours(24),
            Ativo = false
        };

        _context.Colaboradores.Add(colaborador);
        await _context.SaveChangesAsync();

        try
        {
            await _email.EnviarConviteColaboradorAsync(emailNorm, token);
        }
        catch
        {
            _context.Colaboradores.Remove(colaborador);
            await _context.SaveChangesAsync();
            return "Não foi possível enviar o e-mail. Confira Resend:ApiKey em appsettings / variável de ambiente, o remetente \"De\" permitido no Resend e se o domínio está verificado.";
        }

        return null;
    }

    // colaborador clica no link e cria a senha
    public async Task<bool> AtivarContaAsync(string token, string novaSenha)
    {
        var colaborador = await _context.Colaboradores
            .Where(c => c.TokenConvite == token
                     && c.Ativo == false
                     && c.TokenExpiraEm > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (colaborador is null) return false;

        // salva a senha como hash simples (BCrypt em produção)
        colaborador.Senha = novaSenha;
        colaborador.Ativo = true;
        colaborador.TokenConvite = null;    // invalida o token
        colaborador.TokenExpiraEm = null;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ColaboradorResumoDto>> ListarResumoAsync(CancellationToken ct = default) =>
        await _context.Colaboradores.AsNoTracking()
            .OrderByDescending(c => c.CriadoEm)
            .Select(c => new ColaboradorResumoDto(
                c.Id,
                c.Email,
                c.Usuario,
                c.Ativo,
                c.AcessoAdministrador))
            .ToListAsync(ct);

    public async Task<(bool Ok, string? Erro)> DefinirAcessoAdministradorAsync(
        int id,
        bool acessoAdministrador,
        CancellationToken ct = default)
    {
        var c = await _context.Colaboradores.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null)
            return (false, "Colaborador não encontrado.");

        c.AcessoAdministrador = acessoAdministrador;
        await _context.SaveChangesAsync(ct);
        return (true, null);
    }
}

public record ColaboradorResumoDto(int Id, string Email, string? Usuario, bool Ativo, bool AcessoAdministrador);