using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    [EnableRateLimiting("ia-anonima")]
    public async Task<IActionResult> AjustarRotina(
        [FromBody] RotinaRequisicaoDto? requisicao,
        CancellationToken ct)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe os temas de estudo, o nível de energia e as horas livres." });

        return await IaErroHttp.ExecutarAsync(
            this,
            async () => Ok(await _service.AjustarRotinaAsync(requisicao, ct)),
            _logger,
            ct,
            "Não foi possível organizar o plano de estudos agora. Tente novamente em instantes.",
            "Falha ao organizar o plano de estudos. Energia={Energia} Horas={Horas}",
            requisicao.NivelEnergia,
            requisicao.HorasDisponiveis);
    }
}
