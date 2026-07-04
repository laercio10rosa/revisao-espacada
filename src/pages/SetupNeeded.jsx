export default function SetupNeeded() {
  return (
    <div className="page">
      <h1>Configuração necessária</h1>
      <p>
        As credenciais do Firebase ainda não foram definidas. Copie{' '}
        <code>.env.example</code> para <code>.env</code>, preencha com os
        dados do seu projeto Firebase e reinicie o servidor (<code>npm run dev</code>).
      </p>
      <p>Veja o README.md para o passo a passo completo.</p>
    </div>
  )
}
