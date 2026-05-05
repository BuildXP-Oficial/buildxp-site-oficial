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
        var existe = await _context.Colaboradores
            .AnyAsync(c => c.Email == emailColaborador);

        if (existe)
            return "Este e-mail já foi convidado.";

        var token = Guid.NewGuid().ToString("N");

        var colaborador = new Colaborador
        {
            Email = emailColaborador,
            TokenConvite = token,
            TokenExpiraEm = DateTime.UtcNow.AddHours(24),
            Ativo = false
        };

        _context.Colaboradores.Add(colaborador);
        await _context.SaveChangesAsync();

        try
        {
            await _email.EnviarConviteColaboradorAsync(emailColaborador, token);
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
}