using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TerminalController : ControllerBase
{
    private readonly TerminalQuestaoService _service;
    private readonly ILogger<TerminalController> _logger;

    public TerminalController(TerminalQuestaoService service, ILogger<TerminalController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("desafio")]
    public async Task<IActionResult> ObterDesafio([FromQuery] string? tema, [FromQuery] string? nivel)
    {
        try
        {
            var desafio = await _service.ObterDesafioAleatorio(tema ?? string.Empty, nivel ?? string.Empty);
            return Ok(desafio);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha inesperada ao obter desafio de terminal. Tema={Tema} Nivel={Nivel}",
                tema,
                nivel);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível carregar o desafio agora. Tente novamente em instantes." });
        }
    }
}
