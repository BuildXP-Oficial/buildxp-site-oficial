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
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ListarDashboard([FromQuery] StatusFeedback? status)
    {
        var feedbacks = await _service.ListarAsync(status);
        return Ok(feedbacks);
    }

    [HttpPatch("{id}/aprovar")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Aprovar(int id)
    {
        var resultado = await _service.AprovarAsync(id);
        if (!resultado) return NotFound("Feedback não encontrado ou já aprovado.");
        return Ok("Feedback aprovado.");
    }

    [HttpPatch("{id}/rejeitar")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Rejeitar(int id)
    {
        var resultado = await _service.RejeitarAsync(id);
        if (!resultado) return NotFound("Feedback não encontrado ou já rejeitado.");
        return Ok("Feedback rejeitado.");
    }
}
