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
    public async Task<IActionResult> ObterDesafio(
        [FromQuery] string? tema,
        [FromQuery] string? nivel,
        CancellationToken ct)
    {
        return await IaErroHttp.ExecutarAsync(
            this,
            async () => Ok(await _service.ObterDesafioAleatorio(tema ?? string.Empty, nivel ?? string.Empty)),
            _logger,
            ct,
            "Não foi possível carregar o desafio agora. Tente novamente em instantes.",
            "Falha ao obter desafio de terminal. Tema={Tema} Nivel={Nivel}",
            tema ?? string.Empty,
            nivel ?? string.Empty);
    }
}
