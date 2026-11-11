using BuildXP.API.Models;

namespace BuildXP.API.Repositories;

public interface ITerminalQuestaoRepository
{
    Task<IEnumerable<TerminalQuestao>> ObterTodas();
}
