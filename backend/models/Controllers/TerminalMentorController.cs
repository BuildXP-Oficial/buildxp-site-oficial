using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/terminal/mentor")]
public class TerminalMentorController : ControllerBase
{
    private readonly TerminalMentorService _service;
    private readonly ILogger<TerminalMentorController> _logger;

    public TerminalMentorController(TerminalMentorService service, ILogger<TerminalMentorController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> GerarExplicacao([FromBody] MentorRequisicaoDto? requisicao)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe o comando digitado e o comando esperado." });

        try
        {
            var resposta = await _service.GerarExplicacaoAsync(requisicao);
            return Ok(resposta);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha inesperada ao gerar explicação do mentor. ComandoUsuario={ComandoUsuario}",
                requisicao.ComandoUsuario);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível gerar a explicação agora. Tente novamente em instantes." });
        }
    }
}
