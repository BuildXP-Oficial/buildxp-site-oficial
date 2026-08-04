using System.Security.Claims;
using BuildXP.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/markdown")]
public class MarkdownController : ControllerBase
{
    private readonly MarkdownBuilderService _service;

    public MarkdownController(MarkdownBuilderService service) => _service = service;

    [HttpGet("security-questions")]
    public IActionResult ListSecurityQuestions() =>
        Ok(MarkdownSecurityQuestions.All.Select(q => new { id = q.Id, text = q.Text }));

    [HttpGet("security-question/{usuario}")]
    public async Task<IActionResult> GetUserSecurityQuestion(string usuario, CancellationToken ct)
    {
        var payload = await _service.GetSecurityQuestionForUserAsync(usuario, ct);
        if (payload is null) return NotFound(new { message = "user_not_found", detail = "Usuário não encontrado." });
        return Ok(payload);
    }

    [HttpPost("register")]
    [EnableRateLimiting("feedback-publico")]
    public async Task<IActionResult> Register([FromBody] MarkdownRegisterRequest req, CancellationToken ct)
    {
        var (ok, error, payload) = await _service.RegisterAsync(req, ct);
        if (!ok)
        {
            if (error == "user_exists")
                return Conflict(new { message = "user_exists", detail = "Este usuário já existe. Faça login ou escolha outro nome." });
            return BadRequest(new { message = error });
        }
        return Ok(payload);
    }

    [HttpPost("login")]
    [EnableRateLimiting("feedback-publico")]
    public async Task<IActionResult> Login([FromBody] MarkdownLoginRequest req, CancellationToken ct)
    {
        var (ok, error, payload) = await _service.LoginAsync(req, ct);
        if (!ok)
        {
            if (error == "user_not_found")
                return NotFound(new { message = "user_not_found", detail = "Usuário não encontrado. Crie um cadastro." });
            if (error == "wrong_password")
                return Unauthorized(new { message = "wrong_password", detail = "Senha incorreta." });
            return BadRequest(new { message = error });
        }
        return Ok(payload);
    }

    [HttpPost("recover")]
    [EnableRateLimiting("feedback-publico")]
    public async Task<IActionResult> Recover([FromBody] MarkdownRecoverRequest req, CancellationToken ct)
    {
        var (ok, error) = await _service.RecoverAsync(req, ct);
        if (!ok)
        {
            if (error == "user_not_found")
                return NotFound(new { message = "user_not_found", detail = "Usuário não encontrado." });
            if (error == "wrong_answer")
                return Unauthorized(new { message = "wrong_answer", detail = "Resposta de segurança incorreta." });
            return BadRequest(new { message = error });
        }
        return Ok(new { message = "Senha atualizada. Faça login." });
    }

    [HttpGet("doc")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> GetDoc(CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var doc = await _service.GetDocAsync(userId.Value, ct);
        if (doc is null) return NotFound(new { message = "Documento não encontrado." });
        return Ok(doc);
    }

    [HttpPut("doc")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> SaveDoc([FromBody] MarkdownDocSaveRequest req, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var (ok, error, payload) = await _service.SaveDocAsync(userId.Value, req, ct);
        if (!ok) return BadRequest(new { message = error });
        return Ok(payload);
    }

    private int? ResolveUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : null;
    }
}
