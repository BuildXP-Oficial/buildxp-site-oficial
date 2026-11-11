using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api")]
public class CardReadmeShareController : ControllerBase
{
    private readonly CardReadmeShareService _service;

    public CardReadmeShareController(CardReadmeShareService service)
    {
        _service = service;
    }

    [HttpGet("readme-shares")]
    public async Task<IActionResult> ListarTodos(CancellationToken ct)
    {
        var list = await _service.ListarAsync(null, ct);
        return Ok(list);
    }

    [HttpPost("readme-shares")]
    [EnableRateLimiting("readme-share-publico")]
    public async Task<IActionResult> CriarGlobal(
        [FromBody] CardReadmeShareRequest body,
        CancellationToken ct)
    {
        var (item, erro) = await _service.CriarAsync(body?.Slug, body?.Nome ?? "", body?.GithubLink ?? body?.Link ?? "", ct);
        if (erro is not null)
            return BadRequest(new { message = erro });
        return Ok(item);
    }

    [HttpDelete("readme-shares/{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Remover(int id, CancellationToken ct)
    {
        var (ok, erro) = await _service.RemoverAsync(id, ct);
        if (!ok)
            return BadRequest(new { message = erro ?? "Não foi possível excluir." });
        return Ok(new { ok = true });
    }

    [HttpPost("readme-shares/{id:int}/excluir")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        var (ok, erro) = await _service.RemoverAsync(id, ct);
        if (!ok)
            return BadRequest(new { message = erro ?? "Não foi possível excluir." });
        return Ok(new { ok = true });
    }

    [HttpGet("card/{slug}/readme-shares")]
    public async Task<IActionResult> Listar(string slug, CancellationToken ct)
    {
        var list = await _service.ListarAsync(null, ct);
        return Ok(list);
    }

    [HttpPost("card/{slug}/readme-shares")]
    [EnableRateLimiting("readme-share-publico")]
    public async Task<IActionResult> Criar(
        string slug,
        [FromBody] CardReadmeShareRequest body,
        CancellationToken ct)
    {
        var (item, erro) = await _service.CriarAsync(slug, body?.Nome ?? "", body?.GithubLink ?? body?.Link ?? "", ct);
        if (erro is not null)
            return BadRequest(new { message = erro });
        return Ok(item);
    }
}

public record CardReadmeShareRequest(
    [property: JsonPropertyName("nome")] string? Nome,
    [property: JsonPropertyName("githubLink")] string? GithubLink,
    [property: JsonPropertyName("link")] string? Link,
    [property: JsonPropertyName("slug")] string? Slug);
