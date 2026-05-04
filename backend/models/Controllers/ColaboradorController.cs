using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ColaboradorController : ControllerBase
{
    private readonly ColaboradorService _service;

    public ColaboradorController(ColaboradorService service)
    {
        _service = service;
    }

    // POST api/colaborador/convidar — privado — só admin
    [HttpPost("convidar")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Convidar([FromBody] ConviteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "E-mail obrigatório." });

        var erro = await _service.ConvidarAsync(request.Email);
        if (erro is not null)
            return BadRequest(new { message = erro });

        return Ok(new { message = "Colaborador adicionado com sucesso! Um e-mail foi enviado com o link para criar a senha." });
    }

    // POST api/colaborador/ativar — público — colaborador cria senha
    [HttpPost("ativar")]
    public async Task<IActionResult> Ativar([FromBody] AtivacaoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) ||
            string.IsNullOrWhiteSpace(request.Senha))
            return BadRequest(new { message = "Token e senha são obrigatórios." });

        var resultado = await _service.AtivarContaAsync(request.Token, request.Senha);

        if (!resultado)
            return BadRequest(new { message = "Token inválido ou expirado." });

        return Ok(new { message = "Conta ativada com sucesso! Você já pode fazer login." });
    }
}

public record ConviteRequest(string Email);
public record AtivacaoRequest(string Token, string Senha);