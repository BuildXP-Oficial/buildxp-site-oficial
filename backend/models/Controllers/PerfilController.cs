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

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        if (User.IsInRole("admin"))
        {
            var nome = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
            return Ok(new
            {
                role = "admin",
                podeEditarPerfil = false,
                usuario = nome,
                email = (string?)null,
                fotoDataUrl = (string?)null,
            });
        }

        var id = ColaboradorId;
        if (id is null) return Unauthorized();

        var dto = await _perfil.ObterColaboradorAsync(id.Value, ct);
        if (dto is null) return NotFound();

        return Ok(new
        {
            role = "colaborador",
            podeEditarPerfil = true,
            usuario = dto.Usuario,
            email = dto.Email,
            fotoDataUrl = dto.FotoDataUrl,
        });
    }

    [HttpPut("me")]
    public async Task<IActionResult> Atualizar([FromBody] AtualizarPerfilRequest body, CancellationToken ct)
    {
        if (User.IsInRole("admin"))
            return BadRequest(new { message = "Conta de administrador não pode ser alterada aqui." });

        var id = ColaboradorId;
        if (id is null) return Unauthorized();

        var dto = new AtualizarPerfilColaboradorDto(
            body.Usuario,
            body.SenhaAtual,
            body.NovaSenha,
            body.ConfirmarSenha,
            body.RemoverFoto,
            body.FotoBase64,
            body.FotoMimeType);

        var (ok, erro) = await _perfil.AtualizarColaboradorAsync(id.Value, dto, ct);
        if (!ok) return BadRequest(new { message = erro });

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
    string? SenhaAtual,
    string? NovaSenha,
    string? ConfirmarSenha,
    bool RemoverFoto,
    string? FotoBase64,
    string? FotoMimeType);
