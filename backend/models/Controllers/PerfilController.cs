using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PerfilController : ControllerBase
{
    private readonly PerfilService _perfil;
    private readonly AuthService _auth;

    public PerfilController(PerfilService perfil, AuthService auth)
    {
        _perfil = perfil;
        _auth = auth;
    }

    private static bool IsPlataformaAdmin(ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue(ClaimTypes.NameIdentifier), "admin", StringComparison.Ordinal);

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        if (IsPlataformaAdmin(User))
        {
            var cfgNome = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
            var admin = await _perfil.ObterAdminAsync(ct);
            if (admin is null)
            {
                return Ok(new
                {
                    role = "admin",
                    podeEditarPerfil = false,
                    podeGerirColaboradores = true,
                    usuario = cfgNome,
                    email = (string?)null,
                    fotoDataUrl = (string?)null,
                });
            }

            return Ok(new
            {
                role = "admin",
                podeEditarPerfil = true,
                podeGerirColaboradores = true,
                usuario = admin.Usuario,
                email = admin.Email,
                fotoDataUrl = admin.FotoDataUrl,
            });
        }

        var id = ColaboradorId;
        if (id is null) return Unauthorized();

        var colab = await _perfil.ObterColaboradorAsync(id.Value, ct);
        if (colab is null) return NotFound();

        return Ok(new
        {
            role = "colaborador",
            podeEditarPerfil = true,
            podeGerirColaboradores = colab.AcessoAdministrador,
            acessoAdministrador = colab.AcessoAdministrador,
            usuario = colab.Usuario,
            email = colab.Email,
            fotoDataUrl = colab.FotoDataUrl,
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> Atualizar([FromBody] AtualizarPerfilRequest body, CancellationToken ct)
    {
        if (IsPlataformaAdmin(User))
        {
            var adminDto = new AtualizarPerfilAdminDto(
                body.Usuario,
                body.Email,
                body.SenhaAtual,
                body.NovaSenha,
                body.ConfirmarSenha,
                body.RemoverFoto,
                body.FotoBase64,
                body.FotoMimeType);
            var (adminOk, adminErro) = await _perfil.AtualizarAdminAsync(adminDto, ct);
            if (!adminOk) return BadRequest(new { message = adminErro });
            return Ok(new { message = "Perfil atualizado." });
        }

        var id = ColaboradorId;
        if (id is null) return Unauthorized();

        var colabDto = new AtualizarPerfilColaboradorDto(
            body.Usuario,
            body.SenhaAtual,
            body.NovaSenha,
            body.ConfirmarSenha,
            body.RemoverFoto,
            body.FotoBase64,
            body.FotoMimeType);

        var (colabOk, colabErro) = await _perfil.AtualizarColaboradorAsync(id.Value, colabDto, ct);
        if (!colabOk) return BadRequest(new { message = colabErro });

        var token = await _auth.GerarTokenColaboradorPorIdAsync(id.Value, ct);
        return Ok(new { message = "Perfil atualizado.", token });
    }

    private int? ColaboradorId
    {
        get
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(raw) || raw == "admin") return null;
            return int.TryParse(raw, out var id) ? id : null;
        }
    }
}

public record AtualizarPerfilRequest(
    string? Usuario,
    string? Email,
    string? SenhaAtual,
    string? NovaSenha,
    string? ConfirmarSenha,
    bool RemoverFoto,
    string? FotoBase64,
    string? FotoMimeType);
