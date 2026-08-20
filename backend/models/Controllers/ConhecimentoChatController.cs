using Microsoft.AspNetCore.Mvc;
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
    public async Task<IActionResult> Conversar([FromBody] ConhecimentoChatRequisicaoDto? requisicao)
    {
        if (requisicao is null)
            return BadRequest(new { mensagem = "Informe a mensagem e o tema ou card atual." });

        try
        {
            var resposta = await _service.ResponderAsync(requisicao);
            return Ok(resposta);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha inesperada no chat de conhecimento. Tema={Tema}",
                requisicao.TemaOuCardAtual);
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "Não foi possível responder agora. Tente novamente em instantes." });
        }
    }
}
