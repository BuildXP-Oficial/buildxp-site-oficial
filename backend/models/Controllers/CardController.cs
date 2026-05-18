using System.Security.Claims;
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

    /// <summary>Conta admin da plataforma (JWT <c>nameidentifier</c> <c>admin</c>), não colaborador elevado.</summary>
    private static bool IsPlataformaAdmin(ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue(ClaimTypes.NameIdentifier), "admin", StringComparison.Ordinal);

    // ── ROTAS PÚBLICAS ──────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var cards = await _service.ListarAtivosAsync();
        return Ok(cards.Select(c => CardClientDto.FromEntity(c)).ToList());
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

    [HttpGet("panel/" + CardRouteConstants.SlugSegment)]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> BuscarParaEdicao(string slug)
    {
        if (string.Equals(slug, "dashboard", StringComparison.OrdinalIgnoreCase))
            return NotFound();
        var card = await _service.BuscarPorSlugParaEdicaoAsync(slug);
        if (card is null) return NotFound("Card não encontrado.");
        return Ok(CardClientDto.FromEntity(card, forDashboardEdit: true));
    }

    [HttpGet("for-edit/id/{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> BuscarParaEdicaoPorId(int id)
    {
        var card = await _service.BuscarPorIdParaEdicaoAsync(id);
        if (card is null) return NotFound(new { message = "Card não encontrado." });
        return Ok(CardClientDto.FromEntity(card, forDashboardEdit: true));
    }

    [HttpGet("{id:int}/icon/primary")]
    public async Task<IActionResult> GetPrimaryIcon(int id)
    {
        var card = await _service.BuscarPorIdAsync(id);
        if (card is null) return NotFound();
        var icon = _service.GetPrimaryIconBytes(card);
        if (icon is null) return NotFound();
        return File(icon.Value.Data, icon.Value.MimeType);
    }

    [HttpGet("{id:int}/icon/secondary")]
    public async Task<IActionResult> GetSecondaryIcon(int id)
    {
        var card = await _service.BuscarPorIdAsync(id);
        if (card is null) return NotFound();
        var icon = _service.GetSecondaryIconBytes(card);
        if (icon is null) return NotFound();
        return File(icon.Value.Data, icon.Value.MimeType);
    }

    [HttpGet("icon-upload/{uploadId:guid}")]
    public async Task<IActionResult> GetIconUpload(Guid uploadId)
    {
        var upload = await _service.GetIconUploadAsync(uploadId);
        if (upload is null) return NotFound();
        return File(upload.Data, upload.MimeType);
    }

    // ── ROTAS PRIVADAS — só o dashboard acessa ──────────────

    [HttpGet("dashboard")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> ListarDashboard()
    {
        var cards = await _service.ListarTodosAsync();
        return Ok(cards.Select(c => CardClientDto.FromEntity(c)).ToList());
    }

    /// <summary>Grava ícone na base de dados (staging) e devolve referência <c>icon-temp:{guid}</c>.</summary>
    [HttpPost("upload-icon")]
    [Authorize(Roles = "admin,colaborador")]
    [RequestFormLimits(MultipartBodyLengthLimit = 3_000_000)]
    [RequestSizeLimit(3_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadIcon([FromForm] IFormFile? file, CancellationToken ct)
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

        var mime = file.ContentType;
        if (!CardIconHelper.IsAllowedMime(mime))
            mime = CardIconHelper.MimeFromExtension(ext);

        await using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, ct);
        if (buffer.Length == 0)
            return BadRequest(new { message = "Ficheiro vazio." });

        try
        {
            var (_, refKey, previewUrl) = await _service.SaveIconUploadFromBytesAsync(
                buffer.ToArray(),
                mime,
                ct);
            return Ok(new { iconRef = refKey, previewUrl, storage = "db" });
        }
        catch (Exception)
        {
            try
            {
                var webRoot = _env.WebRootPath;
                if (string.IsNullOrEmpty(webRoot))
                    return StatusCode(500, new { message = "Não foi possível gravar o ícone (WebRoot ausente)." });

                var relative = await CardService.SaveIconBytesToWwwrootAsync(
                    buffer.ToArray(),
                    file.FileName,
                    webRoot,
                    ct);
                return Ok(new { iconRef = relative, previewUrl = relative, storage = "file" });
            }
            catch (Exception ex2)
            {
                return StatusCode(500, new { message = "Não foi possível gravar o ícone.", detail = ex2.Message });
            }
        }
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
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new
            {
                message =
                    "Não foi possível gravar o card (base de dados). Confirme ícones e links com no máximo 512 caracteres, slug único e caminhos válidos.",
            });
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
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new
            {
                message =
                    "Não foi possível gravar o card (base de dados). Confirme ícones e links com no máximo 512 caracteres, slug único e caminhos válidos.",
            });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Desativar(int id)
    {
        if (!IsPlataformaAdmin(User))
            return Forbid();
        var resultado = await _service.DesativarAsync(id);
        if (!resultado) return NotFound(new { message = "Card não encontrado." });
        return Ok(new { message = "Card excluído." });
    }

    [HttpPost("{id:int}/slides")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> AdicionarSlide(int id, [FromBody] Slide slide)
    {
        slide.CardId = id;
        try
        {
            var criado = await _service.AdicionarSlideAsync(slide);
            if (criado is null)
            {
                return NotFound(new
                {
                    message =
                        $"Não existe SkillCard com Id={id} nesta base de dados. Guarde primeiro o formulário do card ou abra FORM + SLIDES de novo para recarregar o id correto (evite usar id assumido pela página estática).",
                });
            }

            return Created("", new { id = criado.Id, cardId = criado.CardId, ordem = criado.Ordem });
        }
        catch (Exception ex)
        {
            // DbUpdateException (ex.: FK) por vezes vem apenas como InnerException
            for (Exception? scan = ex; scan != null; scan = scan.InnerException)
            {
                if (scan is DbUpdateException)
                {
                    return BadRequest(new
                    {
                        message =
                            "Não foi possível gravar o slide na base de dados (ex.: vínculo com o card inválido ou limite dos campos). Recarregue o editor e verifique que o mesmo Id do dashboard corresponde a um card existente nesta BD.",
                    });
                }
            }

            throw;
        }
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
        try
        {
            var criado = await _service.AdicionarSlideAsync(slide);
            if (criado is null)
            {
                return NotFound(new
                {
                    message =
                        $"O slug «{slug}» não está associado a um card válido nesta base de dados. Crie o card ou atualize esta instância da API.",
                });
            }

            return Created("", new { id = criado.Id, cardId = criado.CardId, ordem = criado.Ordem });
        }
        catch (Exception ex)
        {
            for (Exception? scan = ex; scan != null; scan = scan.InnerException)
            {
                if (scan is DbUpdateException)
                {
                    return BadRequest(new
                    {
                        message =
                            "Não foi possível gravar o slide na base de dados. Confirme título/descrição e tente novamente.",
                    });
                }
            }

            throw;
        }
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
