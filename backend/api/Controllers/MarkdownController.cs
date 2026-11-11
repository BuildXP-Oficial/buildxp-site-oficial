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

    [HttpGet("templates")]
    public async Task<IActionResult> ListTemplates(CancellationToken ct)
    {
        var list = await _service.ListTemplatesAsync(ct);
        return Ok(list);
    }

    [HttpGet("templates/mine")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> ListMyTemplates(CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        return Ok(await _service.ListMyTemplatesAsync(userId.Value, ct));
    }

    [HttpPost("templates/preview-anon")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> PreviewAnonymize(CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var payload = await _service.PreviewAnonymizeAsync(userId.Value, ct);
        if (payload is null)
            return BadRequest(new { message = "Escreve algum markdown antes de preparar o modelo." });
        return Ok(payload);
    }

    [HttpGet("templates/mine/{id:int}")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> GetMyTemplate(int id, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var t = await _service.GetMyTemplateAsync(userId.Value, id, ct);
        if (t is null) return NotFound(new { message = "Modelo não encontrado." });
        return Ok(t);
    }

    [HttpGet("templates/{id:int}")]
    public async Task<IActionResult> GetTemplate(int id, CancellationToken ct)
    {
        var t = await _service.GetTemplateAsync(id, ct);
        if (t is null) return NotFound(new { message = "Modelo não encontrado." });
        return Ok(t);
    }

    [HttpGet("share")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> GetShare(CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        return Ok(await _service.GetShareStateAsync(userId.Value, ct));
    }

    [HttpPut("share")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> SetShare([FromBody] MarkdownShareRequest req, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var (ok, error, payload) = await _service.SetShareAsync(userId.Value, req, ct);
        if (!ok) return BadRequest(new { message = error });
        return Ok(payload);
    }

    [HttpPost("templates/mine")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> PublishMyTemplate([FromBody] MarkdownShareRequest? req, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var body = req ?? new MarkdownShareRequest();
        body.Acao = "novo";
        var (ok, error, payload) = await _service.SetShareAsync(userId.Value, body, ct);
        if (!ok) return BadRequest(new { message = error });
        return Ok(payload);
    }

    [HttpPut("templates/mine/{id:int}")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> UpdateMyTemplate(int id, [FromBody] MarkdownShareRequest? req, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var body = req ?? new MarkdownShareRequest();
        body.Acao = "atualizar";
        body.TemplateId = id;
        var (ok, error, payload) = await _service.SetShareAsync(userId.Value, body, ct);
        if (!ok) return BadRequest(new { message = error });
        return Ok(payload);
    }

    [HttpPut("templates/mine/{id:int}/status")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> SetMyTemplateStatus(
        int id,
        [FromBody] MarkdownTemplateStatusRequest req,
        CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var (ok, error, payload) = await _service.SetMyTemplateActiveAsync(userId.Value, id, req.Ativo, ct);
        if (!ok) return BadRequest(new { message = error });
        return Ok(payload);
    }

    [HttpDelete("templates/mine/{id:int}")]
    [Authorize(Roles = MarkdownBuilderService.JwtRole)]
    public async Task<IActionResult> DeleteMyTemplate(int id, CancellationToken ct)
    {
        var userId = ResolveUserId();
        if (userId is null) return Unauthorized();
        var (ok, error, payload) = await _service.DeleteMyTemplateAsync(userId.Value, id, ct);
        if (!ok) return BadRequest(new { message = error });
        return Ok(payload);
    }

    private int? ResolveUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : null;
    }
}
