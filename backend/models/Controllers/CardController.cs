using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BuildXP.API.Services;
using BuildXP.API.Models;

namespace BuildXP.API.Controllers;

// Slug nunca é só dígitos — evita que "1" em /api/card/1/slides case no {slug}.
// Sem [ ] na regex: no ASP.NET, [ e ] em templates são tokens; usar [[ ]] quebraria a classe.
internal static class CardRouteConstants
{
    public const string SlugSegment = @"{slug:regex(^(?!\d+$).+)}";
}

[ApiController]
[Route("api/[controller]")]
public class CardController : ControllerBase
{
    private readonly CardService _service;

    public CardController(CardService service)
    {
        _service = service;
    }

    // ── ROTAS PÚBLICAS ──────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var cards = await _service.ListarAtivosAsync();
        return Ok(cards.Select(CardClientDto.FromEntity).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var card = await _service.BuscarPorIdAsync(id);
        if (card is null) return NotFound("Card não encontrado.");
        return Ok(CardClientDto.FromEntity(card));
    }

    [HttpGet(CardRouteConstants.SlugSegment)]
    public async Task<IActionResult> BuscarPorSlug(string slug)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        var card = await _service.BuscarPorSlugAsync(slug);
        if (card is null) return NotFound("Card não encontrado.");
        return Ok(CardClientDto.FromEntity(card));
    }

    // ── ROTAS PRIVADAS — só o dashboard acessa ──────────────

    [HttpGet("dashboard")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ListarDashboard()
    {
        var cards = await _service.ListarTodosAsync();
        return Ok(cards.Select(CardClientDto.FromEntity).ToList());
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Criar([FromBody] CardDashboardPayload payload)
    {
        if (string.IsNullOrWhiteSpace(payload.Slug))
            return BadRequest("Slug é obrigatório.");
        try
        {
            var criado = await _service.CriarDoPayloadAsync(payload);
            return Created("", CardClientDto.FromEntity(criado));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Editar(int id, [FromBody] CardDashboardPayload payload)
    {
        var resultado = await _service.EditarAsync(id, payload);
        if (!resultado) return NotFound("Card não encontrado.");
        return Ok("Card atualizado.");
    }

    [HttpPut(CardRouteConstants.SlugSegment)]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> EditarPorSlug(string slug, [FromBody] CardDashboardPayload payload)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        var resultado = await _service.EditarPorSlugAsync(slug, payload);
        if (!resultado) return NotFound("Card não encontrado.");
        return Ok("Card atualizado.");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Desativar(int id)
    {
        var resultado = await _service.DesativarAsync(id);
        if (!resultado) return NotFound("Card não encontrado.");
        return Ok("Card desativado.");
    }

    [HttpPost("{id:int}/slides")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdicionarSlide(int id, [FromBody] Slide slide)
    {
        slide.CardId = id;
        var criado = await _service.AdicionarSlideAsync(slide);
        return Created("", criado);
    }

    [HttpPost($"{CardRouteConstants.SlugSegment}/slides")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdicionarSlidePorSlug(string slug, [FromBody] Slide slide)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        var cardId = await _service.ResolverIdPorSlugAsync(slug);
        if (cardId is null) return NotFound("Card não encontrado.");
        slide.CardId = cardId.Value;
        var criado = await _service.AdicionarSlideAsync(slide);
        return Created("", criado);
    }

    [HttpPut("slides/{slideId:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> EditarSlide(int slideId, [FromBody] Slide slide)
    {
        var resultado = await _service.EditarSlideAsync(slideId, slide);
        if (!resultado) return NotFound("Slide não encontrado.");
        return Ok("Slide atualizado.");
    }

    [HttpDelete("slides/{slideId:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RemoverSlide(int slideId)
    {
        var resultado = await _service.RemoverSlideAsync(slideId);
        if (!resultado) return NotFound("Slide não encontrado.");
        return Ok("Slide removido.");
    }

    [HttpPost("{id:int}/referencias")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdicionarReferencia(int id, [FromBody] ReferenciaRapida referencia)
    {
        referencia.CardId = id;
        var criada = await _service.AdicionarReferenciaAsync(referencia);
        return Created("", criada);
    }

    [HttpPost($"{CardRouteConstants.SlugSegment}/referencias")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdicionarReferenciaPorSlug(string slug, [FromBody] ReferenciaRapida referencia)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        var cardId = await _service.ResolverIdPorSlugAsync(slug);
        if (cardId is null) return NotFound("Card não encontrado.");
        referencia.CardId = cardId.Value;
        var criada = await _service.AdicionarReferenciaAsync(referencia);
        return Created("", criada);
    }

    [HttpDelete("referencias/{refId:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RemoverReferencia(int refId)
    {
        var resultado = await _service.RemoverReferenciaAsync(refId);
        if (!resultado) return NotFound("Referência não encontrada.");
        return Ok("Referência removida.");
    }
}
