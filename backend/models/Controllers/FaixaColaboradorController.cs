using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FaixaColaboradorController : ControllerBase
{
    private readonly FaixaColaboradorService _service;

    public FaixaColaboradorController(FaixaColaboradorService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> ListarPublico(CancellationToken ct)
    {
        var list = await _service.ListarAsync(ct);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Criar([FromBody] FaixaColaboradorRequest body, CancellationToken ct)
    {
        var (item, erro) = await _service.CriarAsync(body?.Nome ?? "", body?.Icone ?? "", body?.Link ?? "", ct);
        if (erro is not null)
            return BadRequest(new { message = erro });
        return Ok(item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Atualizar(
        int id,
        [FromBody] FaixaColaboradorRequest body,
        CancellationToken ct)
    {
        var (item, erro) = await _service.AtualizarAsync(id, body?.Nome ?? "", body?.Icone ?? "", body?.Link ?? "", ct);
        if (erro is not null)
            return BadRequest(new { message = erro });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        var (ok, erro) = await _service.ExcluirAsync(id, ct);
        if (!ok)
            return BadRequest(new { message = erro });
        return Ok(new { message = "Removido da faixa da home." });
    }
}

public record FaixaColaboradorRequest(string? Nome, string? Icone, string? Link);
