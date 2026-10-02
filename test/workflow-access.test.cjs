const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

for (const workflow of ['ai-collaboration', 'live-smoke']) {
  const text = fs.readFileSync(path.join(__dirname, '../.github/workflows', workflow + '.yml'), 'utf8');
  const code = text.match(/node <<'NODE'\n([\s\S]*?)\n          NODE/)[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  async function execute(responses) {
    const errors = [], calls = [], output = [];
    const process = { env: { CI_TOKEN:'do-not-print', GITHUB_EVENT_NAME:'workflow_dispatch', GITHUB_REPOSITORY:'6076446993/Nexus-Public-CI', GITHUB_RUN_ID:'1', GITHUB_OUTPUT:'output' }, exit:code => { process.exitCode=code; } };
    await vm.runInNewContext(code, {
      process, console: { error:message => errors.push(message) },
      require:name => { assert.equal(name,'node:fs'); return { appendFileSync:(file,text) => output.push(text) }; },
      fetch:async (url, options) => { calls.push({url,method:options.method}); assert.equal(options.headers.Authorization,'Bearer do-not-print'); const response=responses.shift(); return { ok:response.status===200||response.status===201, status:response.status, json:async()=>response.body }; },
    });
    return { errors, calls, output, exitCode:process.exitCode };
  }
  test(workflow + ': private PR access failure names exact permission and stops before status publication', async () => {
    const result=await execute([{status:404}]);
    assert.equal(result.exitCode,1); assert.equal(result.calls.length,1); assert.equal(result.output.length,0);
    assert.match(result.errors[0], /NEXUS-CI-ACCESS.*GET.*AI-collaboration-\/pulls\/10.*HTTP 404.*Pull requests: read/);
    assert.doesNotMatch(result.errors.join(''), /do-not-print/);
  });
  test(workflow + ': status write failure names its separate permission without claiming a run', async () => {
    const sha='a'.repeat(40);
    const result=await execute([{status:200,body:{state:'closed',head:{repo:{full_name:'6076446993/AI-collaboration-'}}}},{status:200,body:{commit:{sha}}},{status:403}]);
    assert.equal(result.exitCode,1); assert.equal(result.output.length,0);
    assert.match(result.errors[0], /POST.*statuses.*HTTP 403.*Commit statuses: write/);
  });
  test(workflow + ': publishes pending only on the exact verified target SHA', async () => {
    const sha='a'.repeat(40);
    const result=await execute([{status:200,body:{state:'closed',head:{repo:{full_name:'6076446993/AI-collaboration-'}}}},{status:200,body:{commit:{sha}}},{status:201,body:{}}]);
    assert.equal(result.errors.length,0); assert.deepEqual(result.output,['sha='+sha+'\n']); assert.ok(result.calls[2].url.endsWith('/statuses/'+sha));
  });
}
