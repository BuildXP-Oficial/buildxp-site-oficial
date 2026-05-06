using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public class AuthService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _context;

    public AuthService(IConfiguration config, AppDbContext context)
    {
        _config = config;
        _context = context;
    }

    public async Task<string?> LoginAsync(string loginId, string senha, CancellationToken ct = default)
    {
        var lid = loginId.Trim();
        if (string.IsNullOrEmpty(lid) || string.IsNullOrEmpty(senha))
            return null;

        var adminUser = (_config["Admin:Usuario"] ?? "").Trim();
        var adminPass = _config["Admin:Senha"] ?? "";
        var adminEmail = (_config["Admin:Email"] ?? "").Trim();

        var passwordMatchesAdmin = senha == adminPass;
        var loginMatchesAdminUser = string.Equals(lid, adminUser, StringComparison.OrdinalIgnoreCase);
        var loginMatchesAdminEmail = !string.IsNullOrEmpty(adminEmail) &&
                                     string.Equals(lid, adminEmail, StringComparison.OrdinalIgnoreCase);

        if (passwordMatchesAdmin && (loginMatchesAdminUser || loginMatchesAdminEmail))
            return GerarTokenAdmin();

        var lower = lid.ToLowerInvariant();
        var colaborador = await _context.Colaboradores
            .AsNoTracking()
            .Where(c => c.Ativo
                        && (c.Email.ToLower() == lower ||
                            (c.Usuario != null && c.Usuario.ToLower() == lower)))
            .FirstOrDefaultAsync(ct);

        if (colaborador is null || colaborador.Senha != senha)
            return null;

        return GerarTokenColaborador(colaborador);
    }

    private string GerarTokenAdmin()
    {
        var chave = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Chave"]!));

        var credenciais = new SigningCredentials(
            chave, SecurityAlgorithms.HmacSha256);

        var nomeAdmin = _config["Admin:Usuario"]!;
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "admin"),
            new Claim(ClaimTypes.NameIdentifier, "admin"),
            new Claim(ClaimTypes.Name, nomeAdmin),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GerarTokenColaborador(Colaborador c)
    {
        var chave = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Chave"]!));

        var credenciais = new SigningCredentials(
            chave, SecurityAlgorithms.HmacSha256);

        var display = string.IsNullOrWhiteSpace(c.Usuario) ? c.Email : c.Usuario!;
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "colaborador"),
            new Claim(ClaimTypes.NameIdentifier, c.Id.ToString()),
            new Claim(ClaimTypes.Email, c.Email),
            new Claim(ClaimTypes.Name, display),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Recarrega claims após alteração de perfil (utilizador no JWT).</summary>
    public async Task<string?> GerarTokenColaboradorPorIdAsync(int id, CancellationToken ct = default)
    {
        var c = await _context.Colaboradores.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.Ativo, ct);
        return c is null ? null : GerarTokenColaborador(c);
    }

    /// <summary>Gera código só se existir colaborador com este e-mail (ativo ou convite pendente).</summary>
    public async Task<string?> GerarCodigoRecuperacaoAsync(string email)
    {
        var e = email.Trim().ToLowerInvariant();
        var existeConta = await _context.Colaboradores.AnyAsync(c => c.Email.ToLower() == e);
        if (!existeConta)
            return null;

        var codigo = new Random().Next(100000, 999999).ToString();

        var recuperacao = new RecuperacaoSenha
        {
            Email = e,
            Codigo = codigo,
            ExpiraEm = DateTime.UtcNow.AddMinutes(15),
            Usado = false
        };

        _context.RecuperacoesSenha.Add(recuperacao);
        await _context.SaveChangesAsync();

        return codigo;
    }

    /// <summary>Confirma código válido e conta existente (mesmas regras que <see cref="RedefinirSenhaAsync"/>).</summary>
    public async Task<bool> CodigoRecuperacaoValidoAsync(string email, string codigo)
    {
        var e = email.Trim().ToLowerInvariant();
        var c = codigo.Trim();
        if (string.IsNullOrEmpty(e) || string.IsNullOrEmpty(c)) return false;

        var existeConta = await _context.Colaboradores.AnyAsync(x => x.Email.ToLower() == e);
        if (!existeConta)
            return false;

        return await _context.RecuperacoesSenha.AsNoTracking()
            .AnyAsync(r =>
                r.Email.ToLower() == e
                && r.Codigo == c
                && !r.Usado
                && r.ExpiraEm > DateTime.UtcNow);
    }

    public async Task<bool> RedefinirSenhaAsync(string email, string codigo, string novaSenha)
    {
        var em = email.Trim().ToLowerInvariant();
        var cod = codigo.Trim();

        var recuperacao = await _context.RecuperacoesSenha
            .Where(r => r.Email.ToLower() == em
                     && r.Codigo == cod
                     && r.Usado == false
                     && r.ExpiraEm > DateTime.UtcNow)
            .OrderByDescending(r => r.Id)
            .FirstOrDefaultAsync();

        if (recuperacao is null) return false;

        var colaborador = await _context.Colaboradores
            .Where(c => c.Email.ToLower() == em)
            .FirstOrDefaultAsync();

        if (colaborador is null) return false;

        colaborador.Senha = novaSenha;
        colaborador.Ativo = true;
        colaborador.TokenConvite = null;
        colaborador.TokenExpiraEm = null;
        recuperacao.Usado = true;
        await _context.SaveChangesAsync();

        return true;
    }
}