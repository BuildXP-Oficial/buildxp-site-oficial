using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;
    private readonly EmailService _email;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService service, EmailService email, ILogger<AuthController> logger)
    {
        _service = service;
        _email = email;
        _logger = logger;
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var login = await _service.LoginAsync(request.Usuario, request.Senha, ct);
        if (login is null) return Unauthorized(new { message = "Credenciais inválidas." });
        return Ok(new { token = login.Token, podeGerirColaboradores = login.PodeGerirColaboradores });
    }

    // POST api/auth/recuperar-senha
    [HttpPost("recuperar-senha")]
    public async Task<IActionResult> RecuperarSenha([FromBody] RecuperacaoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Email))
            return BadRequest(new { message = "Informe o e-mail." });

        var email = request.Email.Trim();

        string? codigo;
        try
        {
            codigo = await _service.GerarCodigoRecuperacaoAsync(email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao gerar código de recuperação para {Email}", email);
            return StatusCode(500, new { message = "Não foi possível processar o pedido. Tente novamente." });
        }

        if (codigo is null)
        {
            return Ok(new
            {
                message = "Se existir conta com este e-mail, receberá um código em instantes.",
            });
        }

        try
        {
            await _email.EnviarCodigoRecuperacaoSenhaAsync(email, codigo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar e-mail de recuperação para {Email}", email);
            return StatusCode(503, new
            {
                message =
                    "Não foi possível enviar o e-mail. Confira a ApiKey do Resend, o remetente (Resend:De) e se o destinatário está autorizado na sua conta Resend.",
            });
        }

        return Ok(new { message = "Código enviado para o e-mail." });
    }

    // POST api/auth/validar-codigo-recuperacao
    [HttpPost("validar-codigo-recuperacao")]
    public async Task<IActionResult> ValidarCodigoRecuperacao([FromBody] ValidarCodigoRecuperacaoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Email) || string.IsNullOrWhiteSpace(request?.Codigo))
            return BadRequest(new { message = "E-mail e código são obrigatórios." });

        var ok = await _service.CodigoRecuperacaoValidoAsync(request.Email, request.Codigo);
        if (!ok) return BadRequest(new { message = "Código inválido ou expirado." });
        return Ok(new { ok = true });
    }

    // POST api/auth/redefinir-senha
    [HttpPost("redefinir-senha")]
    public async Task<IActionResult> RedefinirSenha([FromBody] RedefinicaoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.NovaSenha) || request.NovaSenha.Length < 6)
            return BadRequest(new { message = "A nova senha deve ter pelo menos 6 caracteres." });

        var resultado = await _service.RedefinirSenhaAsync(
            request.Email, request.Codigo, request.NovaSenha);

        if (!resultado)
            return BadRequest(new { message = "Código inválido ou expirado. Peça um novo código ou confira o e-mail." });
        return Ok(new { message = "Senha redefinida com sucesso." });
    }
}

// DTOs — objetos simples para receber os dados das requisições
public record LoginRequest(string Usuario, string Senha);
public record RecuperacaoRequest(string Email);
public record ValidarCodigoRecuperacaoRequest(string Email, string Codigo);
public record RedefinicaoRequest(string Email, string Codigo, string NovaSenha);