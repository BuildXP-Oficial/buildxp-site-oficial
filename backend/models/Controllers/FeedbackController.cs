using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using BuildXP.API.Services;
using BuildXP.API.Models;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly FeedbackService _service;
    private readonly EmailService _email;

    public FeedbackController(FeedbackService service, EmailService email)
    {
        _service = service;
        _email = email;
    }

    /// <summary>Nome a gravar no histórico: corpo do pedido (opcional) ou claims do JWT.</summary>
    private static string ResolverNomeModerador(ClaimsPrincipal user, string? moderadorPedido)
    {
        var fromBody = (moderadorPedido ?? "").Trim();
        if (fromBody.Length > 0)
            return fromBody.Length > 120 ? fromBody[..120] : fromBody;

        var name = user.FindFirst(ClaimTypes.Name)?.Value?.Trim();
        if (!string.IsNullOrEmpty(name))
            return name.Length > 120 ? name[..120] : name;

        var email = user.FindFirst(ClaimTypes.Email)?.Value?.Trim();
        if (!string.IsNullOrEmpty(email))
            return email.Length > 120 ? email[..120] : email;

        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value?.Trim();
        if (!string.IsNullOrEmpty(sub))
            return sub.Length > 120 ? sub[..120] : sub;

        return "painel";
    }

    // ── ROTAS PÚBLICAS ──────────────────────────────────────

    [HttpGet("aprovados")]
    public async Task<IActionResult> ListarAprovados()
    {
        var feedbacks = await _service.ListarAprovadosAsync();
        return Ok(feedbacks);
    }

    [HttpPost]
    [EnableRateLimiting("feedback-publico")]
    public async Task<IActionResult> Enviar([FromBody] FeedbackEnviarRequest body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Mensagem))
            return BadRequest("Mensagem é obrigatória.");

        var categoria = (body.Categoria ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(categoria))
            return BadRequest("Categoria é obrigatória.");
        if (categoria.Length > 40)
            categoria = categoria[..40];

        var mensagem = body.Mensagem.Trim();
        if (mensagem.Length > 1000)
            return BadRequest("Mensagem muito longa.");

        var nome = (body.Nome ?? string.Empty).Trim();
        if (nome.Length > 100)
            nome = nome[..100];

        if (await _service.ExisteDuplicadoRecenteAsync(nome, categoria, mensagem))
            return Ok(new { mensagem = "Feedback recebido com sucesso!", duplicadoIgnorado = true });

        var feedback = new Feedback
        {
            Nome = nome,
            Categoria = categoria,
            Mensagem = mensagem,
            Status = StatusFeedback.Pendente,
            CriadoEm = DateTime.UtcNow,
        };

        await _service.CriarAsync(feedback);
        var nomeEmail = string.IsNullOrEmpty(nome) ? "Anónimo" : nome;
        _ = _email.NotificarNovoFeedbackAsync(nomeEmail, categoria, mensagem);

        return Ok(new { mensagem = "Feedback recebido com sucesso!" });
    }

    // ── ROTAS PRIVADAS — só o dashboard acessa ──────────────

    [HttpGet("dashboard")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> ListarDashboard([FromQuery] StatusFeedback? status)
    {
        var feedbacks = await _service.ListarAsync(status);
        return Ok(feedbacks);
    }

    [HttpPatch("{id}/aprovar")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Aprovar(int id, [FromBody] FeedbackModerarRequest? body)
    {
        var mod = ResolverNomeModerador(User, body?.Moderador);
        var resultado = await _service.AprovarAsync(id, mod);
        if (!resultado) return NotFound("Feedback não encontrado ou já aprovado.");
        return Ok("Feedback aprovado.");
    }

    [HttpPatch("{id}/rejeitar")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Rejeitar(int id, [FromBody] FeedbackModerarRequest? body)
    {
        var mod = ResolverNomeModerador(User, body?.Moderador);
        var resultado = await _service.RejeitarAsync(id, mod);
        if (!resultado) return NotFound("Feedback não encontrado ou já rejeitado.");
        return Ok("Feedback rejeitado.");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Excluir(int id)
    {
        var ok = await _service.ExcluirAsync(id);
        if (!ok) return NotFound(new { message = "Feedback não encontrado." });
        return NoContent();
    }
}

public record FeedbackModerarRequest(string? Moderador);

/// <summary>Pedido público de feedback — nome opcional em qualquer categoria.</summary>
public record FeedbackEnviarRequest(
    [property: JsonPropertyName("mensagem")] string Mensagem,
    [property: JsonPropertyName("categoria")] string Categoria,
    [property: JsonPropertyName("nome")] string? Nome = null);
