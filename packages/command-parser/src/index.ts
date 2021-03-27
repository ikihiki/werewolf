import yargs from 'yargs'
import { UserId } from 'werewolf'

interface UserResolver{
    resolveUserId(userName:string):UserId;
}

const paser = yargs
  .scriptName('werewolf')
  .help()
  .showHelpOnFail(true)
  .command('NewGame <users>', 'New game', args =>
    args
      .positional('users', {
        type: 'string',
        demandOption: true
      })
      .option('werewolf', { alias: 'w', number: true, description: 'number of werewolf', default: 2 })
      .option('psycho', { alias: 'o', number: true, description: 'number of psycho', default: 0 })
      .option('fortuneTeller', { alias: 't', number: true, description: 'number of fortune teller', default: 0 })
      .option('knight', { alias: 'k', number: true, description: 'number of knight', default: 0 })
      .option('psychic', { alias: 'c', number: true, description: 'number of psychic', default: 0 })
      .option('sharer', { alias: 's', number: true, description: 'number of sharer', default: 0 })
      .option('day', { alias: 'd', string: true, description: 'day length', default: 'PT6H' })
      .option('night', { alias: 'n', string: true, description: 'night length', default: 'PT6H' })
      .option('vote', { alias: 'v', string: true, description: 'vote time length', default: 'PT1H' })
      .option('finalVote', { alias: 'f', string: true, description: 'final vote time length', default: 'PT10M' })

  )
  .command('waive', 'ゲームを放棄')

export function parse (value:string) {
  paser.parse(value, (err: Error | undefined, argv: any, output: string) => {console.log(output)})
}
