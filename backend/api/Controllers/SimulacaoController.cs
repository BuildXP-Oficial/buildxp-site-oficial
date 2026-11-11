using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/simulacao")]
public class SimulacaoController : ControllerBase
{
    private const int MaxHistoricoFeedback = 32;

    private readonly SimulacaoService _service;
    private readonly ILogger<SimulacaoController> _logger;

    public SimulacaoController(SimulacaoService service, ILogger<SimulacaoController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost("turno")]
    [EnableRateLimiting("ia-anonima")]
    public async Task<IActionResult> ProcessarTurno(
        [FromBody] SimulacaoRequisicaoDto? requisicao,
        CancellationToken ct)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe a persona, o cenário e a mensagem do usuário." });

        return await IaErroHttp.ExecutarAsync(
            this,
            async () => Ok(await _service.ProcessarTurnoAsync(requisicao, ct)),
            _logger,
            ct,
            "Não foi possível processar o turno agora. Tente novamente em instantes.",
            "Falha ao processar o turno da simulação. Persona={Persona}",
            requisicao.Persona);
    }

    [HttpPost("feedback")]
    [EnableRateLimiting("ia-anonima")]
    public async Task<IActionResult> GerarFeedback(
        [FromBody] List<MensagemHistoricoDto>? historico,
        CancellationToken ct)
    {
        if (historico is null)
            return BadRequest(new { mensagem = "Informe o histórico de mensagens da simulação." });
        if (historico.Count > MaxHistoricoFeedback)
            return BadRequest(new { mensagem = $"O histórico aceita no máximo {MaxHistoricoFeedback} mensagens." });

        return await IaErroHttp.ExecutarAsync(
            this,
            async () => Ok(await _service.GerarFeedbackAsync(historico, ct)),
            _logger,
            ct,
            "Não foi possível gerar o feedback agora. Tente novamente em instantes.",
            "Falha ao gerar o feedback da simulação. Mensagens={Mensagens}",
            historico.Count);
    }
}
