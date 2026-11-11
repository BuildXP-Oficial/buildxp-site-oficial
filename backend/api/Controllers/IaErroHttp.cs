using Microsoft.AspNetCore.Mvc;
using BuildXP.API;

namespace BuildXP.API.Controllers;

internal static class IaErroHttp
{
    internal static int StatusPara(Exception ex) => ex switch
    {
        GroqIndisponivelException => StatusCodes.Status503ServiceUnavailable,
        UnauthorizedAccessException => StatusCodes.Status503ServiceUnavailable,
        _ => StatusCodes.Status500InternalServerError,
    };

    internal static async Task<IActionResult> ExecutarAsync(
        ControllerBase controller,
        Func<Task<IActionResult>> acao,
        ILogger logger,
        CancellationToken ct,
        string mensagemAluno,
        string mensagemLog,
        params object[] args)
    {
        try
        {
            return await acao();
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, mensagemLog, args);
            return controller.StatusCode(StatusPara(ex), new { mensagem = mensagemAluno });
        }
    }
}
