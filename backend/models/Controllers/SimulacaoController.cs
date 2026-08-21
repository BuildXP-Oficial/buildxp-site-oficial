using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/simulacao")]
public class SimulacaoController : ControllerBase
{
    private readonly SimulacaoService _service;
    private readonly ILogger<SimulacaoController> _logger;

    public SimulacaoController(SimulacaoService service, ILogger<SimulacaoController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost("turno")]
    public async Task<IActionResult> ProcessarTurno([FromBody] SimulacaoRequisicaoDto? requisicao)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe a persona, o cenário e a mensagem do usuário." });

        try
        {
            var resposta = await _service.ProcessarTurnoAsync(requisicao);
            return Ok(resposta);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogError(ex, "Groq recusou a chave na simulação. Persona={Persona}", requisicao.Persona);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível processar o turno agora. Tente novamente em instantes." });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha inesperada ao processar o turno da simulação. Persona={Persona}",
                requisicao.Persona);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível processar o turno agora. Tente novamente em instantes." });
        }
    }

    [HttpPost("feedback")]
    public async Task<IActionResult> GerarFeedback([FromBody] List<MensagemHistoricoDto>? historico)
    {
        if (historico is null)
            return BadRequest(new { mensagem = "Informe o histórico de mensagens da simulação." });

        try
        {
            var feedback = await _service.GerarFeedbackAsync(historico);
            return Ok(feedback);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogError(ex, "Groq recusou a chave no feedback da simulação. Mensagens={Mensagens}", historico.Count);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível gerar o feedback agora. Tente novamente em instantes." });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha inesperada ao gerar o feedback da simulação. Mensagens={Mensagens}",
                historico.Count);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível gerar o feedback agora. Tente novamente em instantes." });
        }
    }
}
