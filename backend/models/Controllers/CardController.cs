using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    private readonly IWebHostEnvironment _env;

    public CardController(CardService service, IWebHostEnvironment env)
    {
        _service = service;
        _env = env;
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
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> ListarDashboard()
    {
        var cards = await _service.ListarTodosAsync();
        return Ok(cards.Select(CardClientDto.FromEntity).ToList());
    }

    /// <summary>Grava ícone em <c>wwwroot/imagens/</c> e devolve caminho relativo (ex.: <c>imagens/foo.png</c>).</summary>
    [HttpPost("upload-icon")]
    [Authorize(Roles = "admin,colaborador")]
    [RequestFormLimits(MultipartBodyLengthLimit = 3_000_000)]
    [RequestSizeLimit(3_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadIcon(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Selecione um ficheiro de imagem." });

        const long maxBytes = 2 * 1024 * 1024;
        if (file.Length > maxBytes)
            return BadRequest(new { message = "Ficheiro demasiado grande (máx. 2 MB)." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        string[] allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
        if (string.IsNullOrWhiteSpace(ext) || Array.IndexOf(allowed, ext) < 0)
            return BadRequest(new { message = "Use PNG, JPEG, WebP, GIF ou SVG." });

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
            return StatusCode(500, new { message = "WebRoot não configurado." });

        var imagensDir = Path.Combine(webRoot, "imagens");
        Directory.CreateDirectory(imagensDir);

        var baseName = Path.GetFileNameWithoutExtension(file.FileName);
        baseName = Regex.Replace(baseName ?? "", @"[^a-zA-Z0-9_-]", "_");
        if (string.IsNullOrWhiteSpace(baseName)) baseName = "icon";
        if (baseName.Length > 40) baseName = baseName[..40];

        var unique = $"{baseName}_{Guid.NewGuid():N}{ext}";
        var physical = Path.Combine(imagensDir, unique);

        await using (var stream = new FileStream(
                       physical,
                       FileMode.CreateNew,
                       FileAccess.Write,
                       FileShare.None,
                       bufferSize: 65536,
                       options: FileOptions.Asynchronous))
        {
            await file.CopyToAsync(stream, ct);
        }

        var relative = $"imagens/{unique}".Replace('\\', '/');
        return Ok(new { path = relative });
    }

    [HttpPost]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Criar([FromBody] CardDashboardPayload payload)
    {
        try
        {
            var criado = await _service.CriarDoPayloadAsync(payload);
            return Created("", CardClientDto.FromEntity(criado));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (DbUpdateException)
        {
            return BadRequest(
                "Não foi possível gravar o card (dados excedem o limite da base ou violam uma regra). " +
                "Use caminhos curtos para ícones (ex.: imagens/nome.png), não data URL longa; verifique slug único.");
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Editar(int id, [FromBody] CardDashboardPayload payload)
    {
        try
        {
            var resultado = await _service.EditarAsync(id, payload);
            if (!resultado) return NotFound("Card não encontrado.");
            return Ok("Card atualizado.");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut(CardRouteConstants.SlugSegment)]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> EditarPorSlug(string slug, [FromBody] CardDashboardPayload payload)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        try
        {
            var resultado = await _service.EditarPorSlugAsync(slug, payload);
            if (!resultado) return NotFound("Card não encontrado.");
            return Ok("Card atualizado.");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
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
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> AdicionarSlide(int id, [FromBody] Slide slide)
    {
        slide.CardId = id;
        var criado = await _service.AdicionarSlideAsync(slide);
        // Não devolver a entidade Slide — evita ciclos de referência na serialização JSON (500).
        return Created("", new { id = criado.Id, cardId = criado.CardId, ordem = criado.Ordem });
    }

    [HttpPost($"{CardRouteConstants.SlugSegment}/slides")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> AdicionarSlidePorSlug(string slug, [FromBody] Slide slide)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        var cardId = await _service.ResolverIdPorSlugAsync(slug);
        if (cardId is null) return NotFound("Card não encontrado.");
        slide.CardId = cardId.Value;
        var criado = await _service.AdicionarSlideAsync(slide);
        return Created("", new { id = criado.Id, cardId = criado.CardId, ordem = criado.Ordem });
    }

    [HttpPut("slides/{slideId:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> EditarSlide(int slideId, [FromBody] Slide slide)
    {
        var resultado = await _service.EditarSlideAsync(slideId, slide);
        if (!resultado) return NotFound("Slide não encontrado.");
        return Ok("Slide atualizado.");
    }

    [HttpDelete("slides/{slideId:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> RemoverSlide(int slideId)
    {
        var resultado = await _service.RemoverSlideAsync(slideId);
        if (!resultado) return NotFound("Slide não encontrado.");
        return Ok("Slide removido.");
    }

    [HttpPost("{id:int}/referencias")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> AdicionarReferencia(int id, [FromBody] ReferenciaRapida referencia)
    {
        referencia.CardId = id;
        var criada = await _service.AdicionarReferenciaAsync(referencia);
        return Created("", criada);
    }

    [HttpPost($"{CardRouteConstants.SlugSegment}/referencias")]
    [Authorize(Roles = "admin,colaborador")]
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
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> RemoverReferencia(int refId)
    {
        var resultado = await _service.RemoverReferenciaAsync(refId);
        if (!resultado) return NotFound("Referência não encontrada.");
        return Ok("Referência removida.");
    }
}
