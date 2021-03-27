import yargs from "yargs/build";


const  v= yargs.command('a','b');

export function some(){
    return v.parse('a')
}