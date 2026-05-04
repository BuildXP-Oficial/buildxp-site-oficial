using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;

    public AuthController(AuthService service)
    {
        _service = service;
    }

    // POST api/auth/login
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var token = _service.Login(request.Usuario, request.Senha);
        if (token is null) return Unauthorized(new { message = "Credenciais inválidas." });
        return Ok(new { token });
    }

    // POST api/auth/recuperar-senha
    [HttpPost("recuperar-senha")]
    public async Task<IActionResult> RecuperarSenha([FromBody] RecuperacaoRequest request)
    {
        var codigo = await _service.GerarCodigoRecuperacaoAsync(request.Email);
        // envio de e-mail vai aqui depois
        return Ok("Código enviado para o e-mail.");
    }

    // POST api/auth/redefinir-senha
    [HttpPost("redefinir-senha")]
    public async Task<IActionResult> RedefinirSenha([FromBody] RedefinicaoRequest request)
    {
        var resultado = await _service.RedefinirSenhaAsync(
            request.Email, request.Codigo, request.NovaSenha);

        if (!resultado) return BadRequest("Código inválido ou expirado.");
        return Ok("Senha redefinida com sucesso.");
    }
}

// DTOs — objetos simples para receber os dados das requisições
public record LoginRequest(string Usuario, string Senha);
public record RecuperacaoRequest(string Email);
public record RedefinicaoRequest(string Email, string Codigo, string NovaSenha);