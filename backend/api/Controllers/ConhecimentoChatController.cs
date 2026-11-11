using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BuildXP.API.Models.Dtos;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/conhecimento/chat")]
public class ConhecimentoChatController : ControllerBase
{
    private readonly ConhecimentoChatService _service;
    private readonly ILogger<ConhecimentoChatController> _logger;

    public ConhecimentoChatController(ConhecimentoChatService service, ILogger<ConhecimentoChatController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpPost]
    [EnableRateLimiting("conhecimento-chat")]
    public async Task<IActionResult> Conversar(
        [FromBody] ConhecimentoChatRequisicaoDto? requisicao,
        CancellationToken ct)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe a mensagem e o tema ou card atual." });

        return await IaErroHttp.ExecutarAsync(
            this,
            async () => Ok(await _service.ResponderAsync(requisicao, ct)),
            _logger,
            ct,
            "Não foi possível responder agora. Tente novamente em instantes.",
            "Falha no chat de conhecimento. Tema={Tema}",
            requisicao.TemaOuCardAtual);
    }
}
