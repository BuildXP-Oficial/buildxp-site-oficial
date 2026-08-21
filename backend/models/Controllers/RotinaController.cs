using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/rotina")]
public class RotinaController : ControllerBase
{
    private readonly RotinaService _service;
    private readonly ILogger<RotinaController> _logger;

    public RotinaController(RotinaService service, ILogger<RotinaController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> AjustarRotina([FromBody] RotinaRequisicaoDto? requisicao)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe as tarefas atuais, o nível de energia e as horas disponíveis." });

        try
        {
            var resposta = await _service.AjustarRotinaAsync(requisicao);
            return Ok(resposta);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha inesperada ao ajustar a rotina. Energia={Energia} Horas={Horas}",
                requisicao.NivelEnergia,
                requisicao.HorasDisponiveis);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível ajustar a rotina agora. Tente novamente em instantes." });
        }
    }
}
