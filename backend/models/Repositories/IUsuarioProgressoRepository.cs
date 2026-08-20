using BuildXP.API.Models;

namespace BuildXP.API.Repositories;

public interface IUsuarioProgressoRepository
{
    Task<UsuarioProgresso> ObterAsync();

    Task SalvarAsync(UsuarioProgresso progresso);

    Task<UsuarioProgresso> AtualizarAsync(Func<UsuarioProgresso, UsuarioProgresso> atualizar);
}
