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
    public async Task<IActionResult> GerarExplicacao(
        [FromBody] MentorRequisicaoDto? requisicao,
        CancellationToken ct)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe o comando digitado e o comando esperado." });

        return await IaErroHttp.ExecutarAsync(
            this,
            async () => Ok(await _service.GerarExplicacaoAsync(requisicao)),
            _logger,
            ct,
            "Não foi possível gerar a explicação agora. Tente novamente em instantes.",
            "Falha ao gerar explicação do mentor. ComandoUsuario={ComandoUsuario}",
            requisicao.ComandoUsuario);
    }
}
