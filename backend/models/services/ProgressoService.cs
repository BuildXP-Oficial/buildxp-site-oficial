using BuildXP.API.Models.Dtos;
using BuildXP.API.Repositories;

namespace BuildXP.API.Services;

public class ProgressoService
{
    public const int XpPorNivel = 80;

    private readonly IUsuarioProgressoRepository _repositorio;
    private readonly ILogger<ProgressoService> _logger;

    public ProgressoService(
        IUsuarioProgressoRepository repositorio,
        ILogger<ProgressoService> logger)
    {
        _repositorio = repositorio;
        _logger = logger;
    }

    public async Task<UsuarioProgressoDto> ObterAsync()
    {
        var progresso = await _repositorio.ObterAsync();
        return UsuarioProgressoDto.FromEntity(progresso);
    }

    public async Task<UsuarioProgressoDto> AdicionarXpAsync(int xp, int? desafioId = null)
    {
        if (xp <= 0)
        {
            _logger.LogWarning("Tentativa de adicionar XP inválido. Xp={Xp} DesafioId={DesafioId}", xp, desafioId);
            throw new ArgumentOutOfRangeException(nameof(xp), "O XP a adicionar precisa ser maior que zero.");
        }

        var nivelAnterior = 1;
        var subiu = false;

        var progresso = await _repositorio.AtualizarAsync(atual =>
        {
            nivelAnterior = atual.NivelAtual;
            atual.XpTotal += xp;
            atual.DesafiosCompletados += 1;
            atual.NivelAtual = CalcularNivel(atual.XpTotal);
            subiu = atual.NivelAtual > nivelAnterior;
            return atual;
        });

        if (subiu)
        {
            _logger.LogInformation(
                "Usuário subiu de nível. NivelAnterior={NivelAnterior} NivelAtual={NivelAtual} XpTotal={XpTotal}",
                nivelAnterior,
                progresso.NivelAtual,
                progresso.XpTotal);
        }

        return UsuarioProgressoDto.FromEntity(progresso, subiu);
    }

    internal static int CalcularNivel(int xpTotal)
    {
        if (xpTotal < 0)
            return 1;
        return (xpTotal / XpPorNivel) + 1;
    }
}
