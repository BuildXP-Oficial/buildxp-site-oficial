using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public record LoginResult(string Token, bool PodeGerirColaboradores);

public class AuthService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _context;
    private readonly PerfilService _perfil;

    public AuthService(IConfiguration config, AppDbContext context, PerfilService perfil)
    {
        _config = config;
        _context = context;
        _perfil = perfil;
    }

    public async Task<LoginResult?> LoginAsync(string loginId, string senha, CancellationToken ct = default)
    {
        var lid = loginId.Trim();
        if (string.IsNullOrEmpty(lid) || string.IsNullOrEmpty(senha))
            return null;

        var adminUser = (_config["Admin:Usuario"] ?? "").Trim();
        var adminPass = _config["Admin:Senha"] ?? "";
        var adminEmail = (_config["Admin:Email"] ?? "").Trim();

        // Se existir perfil admin persistido no banco, a senha/username devem vir daí (permite troca de senha/foto no dashboard).
        AdminPerfil? dbAdmin = null;
        try
        {
            if (await _perfil.EnsureAdminPerfisTableReadyAsync(ct))
            {
                dbAdmin = await _context.AdminPerfis.AsNoTracking().OrderBy(x => x.Id).FirstOrDefaultAsync(ct);
                if (dbAdmin is null)
                    await TryCriarPerfilAdminInicialAsync(lid, senha, adminUser, adminEmail, adminPass, ct);
                dbAdmin = await _context.AdminPerfis.AsNoTracking().OrderBy(x => x.Id).FirstOrDefaultAsync(ct);
            }
        }
        catch
        {
            dbAdmin = null;
        }

        var effectiveAdminUser = (dbAdmin?.Usuario ?? adminUser).Trim();
        var effectiveAdminEmail = (dbAdmin?.Email ?? adminEmail).Trim();
        var effectiveAdminPass = dbAdmin?.Senha ?? adminPass;

        var passwordMatchesAdmin = senha == effectiveAdminPass;
        var loginMatchesAdminUser = !string.IsNullOrEmpty(effectiveAdminUser) &&
                                    string.Equals(lid, effectiveAdminUser, StringComparison.OrdinalIgnoreCase);
        var loginMatchesAdminEmail = !string.IsNullOrEmpty(effectiveAdminEmail) &&
                                     string.Equals(lid, effectiveAdminEmail, StringComparison.OrdinalIgnoreCase);

        if (passwordMatchesAdmin && (loginMatchesAdminUser || loginMatchesAdminEmail))
            return new LoginResult(GerarTokenAdmin(effectiveAdminUser), PodeGerirColaboradores: true);

        var lower = lid.ToLowerInvariant();
        var colaborador = await _context.Colaboradores
            .AsNoTracking()
            .Where(c => c.Ativo
                        && (c.Email.ToLower() == lower ||
                            (c.Usuario != null && c.Usuario.ToLower() == lower)))
            .FirstOrDefaultAsync(ct);

        if (colaborador is null || colaborador.Senha != senha)
            return null;

        return new LoginResult(
            GerarTokenColaborador(colaborador),
            PodeGerirColaboradores: colaborador.AcessoAdministrador);
    }

    /// <summary>
    /// Primeiro login com credenciais do appsettings: grava uma linha em AdminPerfis (tabela vazia).
    /// Colaboradores continuam só por convite (fluxo existente).
    /// </summary>
    private async Task TryCriarPerfilAdminInicialAsync(
        string loginId,
        string senha,
        string adminUser,
        string adminEmail,
        string adminPass,
        CancellationToken ct)
    {
        if (string.IsNullOrEmpty(adminUser) || string.IsNullOrEmpty(adminPass))
            return;

        if (await _context.AdminPerfis.AnyAsync(ct))
            return;

        var loginOkUser = string.Equals(loginId, adminUser, StringComparison.OrdinalIgnoreCase);
        var loginOkEmail = !string.IsNullOrEmpty(adminEmail) &&
                           string.Equals(loginId, adminEmail, StringComparison.OrdinalIgnoreCase);
        if (!loginOkUser && !loginOkEmail)
            return;

        if (senha != adminPass)
            return;

        _context.AdminPerfis.Add(new AdminPerfil
        {
            Usuario = adminUser,
            Email = string.IsNullOrEmpty(adminEmail) ? null : adminEmail,
            Senha = adminPass,
            AtualizadoEm = DateTime.UtcNow,
        });

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch
        {
            // corrida: outro pedido já inseriu
        }
    }

    private string GerarTokenAdmin(string nomeExibicao)
    {
        var chave = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Chave"]!));

        var credenciais = new SigningCredentials(
            chave, SecurityAlgorithms.HmacSha256);

        var nomeAdmin = string.IsNullOrWhiteSpace(nomeExibicao)
            ? (_config["Admin:Usuario"] ?? "admin").Trim()
            : nomeExibicao.Trim();
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
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, c.Id.ToString()),
            new Claim(ClaimTypes.Email, c.Email),
            new Claim(ClaimTypes.Name, display),
        };
        if (c.AcessoAdministrador)
        {
            claims.Add(new Claim(ClaimTypes.Role, "admin"));
            claims.Add(new Claim(ClaimTypes.Role, "colaborador"));
        }
        else
            claims.Add(new Claim(ClaimTypes.Role, "colaborador"));

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