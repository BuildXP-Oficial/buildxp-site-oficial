using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProgressoController : ControllerBase
{
    private readonly ProgressoService _service;
    private readonly ILogger<ProgressoController> _logger;

    public ProgressoController(ProgressoService service, ILogger<ProgressoController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        try
        {
            var progresso = await _service.ObterAsync();
            return Ok(progresso);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha inesperada ao consultar o progresso do usuário.");
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível consultar o progresso agora. Tente novamente em instantes." });
        }
    }

    [HttpPost("adicionar-xp")]
    public async Task<IActionResult> AdicionarXp([FromBody] AdicionarXpRequest? body)
    {
        if (body is null)
            return BadRequest(new { mensagem = "Informe o XP a adicionar." });

        try
        {
            var progresso = await _service.AdicionarXpAsync(body.Xp, body.DesafioId);
            return Ok(progresso);
        }
        catch (ArgumentOutOfRangeException)
        {
            return BadRequest(new { mensagem = "O XP a adicionar precisa ser maior que zero." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha inesperada ao adicionar XP. Xp={Xp} DesafioId={DesafioId}", body.Xp, body.DesafioId);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível registrar o XP agora. Tente novamente em instantes." });
        }
    }
}
