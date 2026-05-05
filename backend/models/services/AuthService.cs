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

    // valida login e gera token JWT — SEM o } antes daqui
    public string? Login(string usuario, string senha)
    {
        var adminUser = _config["Admin:Usuario"];
        var adminPass = _config["Admin:Senha"];

        if (!string.Equals(usuario, adminUser, StringComparison.OrdinalIgnoreCase) || senha != adminPass)
            return null;

        return GerarToken();
    }

    private string GerarToken()
    {
        var chave = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Chave"]!));

        var credenciais = new SigningCredentials(
            chave, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "admin"),
            new Claim(ClaimTypes.Name, _config["Admin:Usuario"]!)
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

    public async Task<string> GerarCodigoRecuperacaoAsync(string email)
    {
        var e = email.Trim();
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

    /// <summary>Confirma que o código existe, não foi usado e não expirou (sem marcar como usado).</summary>
    public async Task<bool> CodigoRecuperacaoValidoAsync(string email, string codigo)
    {
        var e = email.Trim();
        var c = codigo.Trim();
        if (string.IsNullOrEmpty(e) || string.IsNullOrEmpty(c)) return false;

        return await _context.RecuperacoesSenha.AsNoTracking()
            .AnyAsync(r =>
                r.Email == e
                && r.Codigo == c
                && !r.Usado
                && r.ExpiraEm > DateTime.UtcNow);
    }

    public async Task<bool> RedefinirSenhaAsync(string email, string codigo, string novaSenha)
    {
        var em = email.Trim();
        var cod = codigo.Trim();

        var recuperacao = await _context.RecuperacoesSenha
            .Where(r => r.Email == em
                     && r.Codigo == cod
                     && r.Usado == false
                     && r.ExpiraEm > DateTime.UtcNow)
            .FirstOrDefaultAsync();

        if (recuperacao is null) return false;

        recuperacao.Usado = true;
        await _context.SaveChangesAsync();

        return true;
    }
}