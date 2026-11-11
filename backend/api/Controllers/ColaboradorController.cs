using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BuildXP.API.Services;

namespace BuildXP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ColaboradorController : ControllerBase
{
    private readonly ColaboradorService _service;

    public ColaboradorController(ColaboradorService service)
    {
        _service = service;
    }

    /// <summary>Conta de administrador da plataforma (JWT <c>nameidentifier</c> fixo <c>admin</c>), não colaborador elevado.</summary>
    private static bool IsPlataformaAdmin(ClaimsPrincipal user) =>
        string.Equals(user.FindFirstValue(ClaimTypes.NameIdentifier), "admin", StringComparison.Ordinal);

    // GET api/colaborador — lista só para admin da plataforma (não expõe quem tem acesso elevado a colaboradores).
    [HttpGet]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        if (!IsPlataformaAdmin(User))
            return Forbid();
        var list = await _service.ListarResumoAsync(ct);
        return Ok(list);
    }

    // DELETE api/colaborador/{id} — convite pendente ou colaborador ativo; só plataforma.
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        if (!IsPlataformaAdmin(User))
            return Forbid();
        var (ok, erro) = await _service.ExcluirAsync(id, ct);
        if (!ok) return BadRequest(new { message = erro });
        return Ok(new { message = "Removido com sucesso." });
    }

    // PUT api/colaborador/{id}/acesso-administrador — só plataforma.
    [HttpPut("{id:int}/acesso-administrador")]
    [Authorize(Roles = "admin,colaborador")]
    public async Task<IActionResult> DefinirAcessoAdministrador(
        int id,
        [FromBody] AcessoAdministradorRequest body,
        CancellationToken ct)
    {
        if (!IsPlataformaAdmin(User))
            return Forbid();
        var (ok, erro) = await _service.DefinirAcessoAdministradorAsync(id, body.AcessoAdministrador, ct);
        if (!ok) return BadRequest(new { message = erro });
        return Ok(new { message = "Acesso atualizado." });
    }

    // POST api/colaborador/convidar — privado — só admin
    [HttpPost("convidar")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Convidar([FromBody] ConviteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "E-mail obrigatório." });

        var erro = await _service.ConvidarAsync(request.Email);
        if (erro is not null)
            return BadRequest(new { message = erro });

        return Ok(new { message = "Colaborador adicionado com sucesso! Um e-mail foi enviado com o link para criar a senha." });
    }

    // POST api/colaborador/ativar — público — colaborador cria senha
    [HttpPost("ativar")]
    public async Task<IActionResult> Ativar([FromBody] AtivacaoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) ||
            string.IsNullOrWhiteSpace(request.Senha))
            return BadRequest(new { message = "Token e senha são obrigatórios." });

        var resultado = await _service.AtivarContaAsync(request.Token, request.Senha);

        if (!resultado)
            return BadRequest(new { message = "Token inválido ou expirado." });

        return Ok(new { message = "Conta ativada com sucesso! Você já pode fazer login." });
    }
}

public record ConviteRequest(string Email);
public record AtivacaoRequest(string Token, string Senha);
public record AcessoAdministradorRequest(bool AcessoAdministrador);