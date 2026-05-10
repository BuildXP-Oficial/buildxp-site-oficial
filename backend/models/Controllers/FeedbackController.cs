using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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
    public async Task<IActionResult> Enviar([FromBody] Feedback feedback)
    {
        if (string.IsNullOrWhiteSpace(feedback.Nome) ||
            string.IsNullOrWhiteSpace(feedback.Mensagem))
            return BadRequest("Nome e mensagem são obrigatórios.");

        if (feedback.Mensagem.Length > 1000)
            return BadRequest("Mensagem muito longa.");

        feedback.Status = StatusFeedback.Pendente;
        feedback.CriadoEm = DateTime.UtcNow;

        await _service.CriarAsync(feedback);
        _ = _email.NotificarNovoFeedbackAsync(feedback.Nome, feedback.Mensagem);

        return Created("", new { mensagem = "Feedback recebido com sucesso!" });
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
}

public record FeedbackModerarRequest(string? Moderador);
