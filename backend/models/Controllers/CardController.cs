using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BuildXP.API.Services;
using BuildXP.API.Models;

namespace BuildXP.API.Controllers;

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
        return Ok(cards);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Buscar(int id)
    {
        var card = await _service.BuscarPorIdAsync(id);
        if (card is null) return NotFound("Card não encontrado.");
        return Ok(card);
    }

    // ── ROTAS PRIVADAS — só o dashboard acessa ──────────────

    [HttpGet("dashboard")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ListarDashboard()
    {
        var cards = await _service.ListarTodosAsync();
        return Ok(cards);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Criar([FromBody] SkillCard card)
    {
        if (string.IsNullOrWhiteSpace(card.Titulo))
            return BadRequest("Título obrigatório.");

        var criado = await _service.CriarAsync(card);
        return Created("", criado);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Editar(int id, [FromBody] SkillCard card)
    {
        var resultado = await _service.EditarAsync(id, card);
        if (!resultado) return NotFound("Card não encontrado.");
        return Ok("Card atualizado.");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Desativar(int id)
    {
        var resultado = await _service.DesativarAsync(id);
        if (!resultado) return NotFound("Card não encontrado.");
        return Ok("Card desativado.");
    }

    [HttpPost("{id}/slides")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdicionarSlide(int id, [FromBody] Slide slide)
    {
        slide.CardId = id;
        var criado = await _service.AdicionarSlideAsync(slide);
        return Created("", criado);
    }

    [HttpPut("slides/{slideId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> EditarSlide(int slideId, [FromBody] Slide slide)
    {
        var resultado = await _service.EditarSlideAsync(slideId, slide);
        if (!resultado) return NotFound("Slide não encontrado.");
        return Ok("Slide atualizado.");
    }

    [HttpDelete("slides/{slideId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RemoverSlide(int slideId)
    {
        var resultado = await _service.RemoverSlideAsync(slideId);
        if (!resultado) return NotFound("Slide não encontrado.");
        return Ok("Slide removido.");
    }

    [HttpPost("{id}/referencias")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AdicionarReferencia(int id, [FromBody] ReferenciaRapida referencia)
    {
        referencia.CardId = id;
        var criada = await _service.AdicionarReferenciaAsync(referencia);
        return Created("", criada);
    }

    [HttpDelete("referencias/{refId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RemoverReferencia(int refId)
    {
        var resultado = await _service.RemoverReferenciaAsync(refId);
        if (!resultado) return NotFound("Referência não encontrada.");
        return Ok("Referência removida.");
    }
}