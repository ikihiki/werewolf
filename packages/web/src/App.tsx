import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useSelector } from 'react-redux';
import { Game, gameSelector, playersSelector, usersSelector, votingTargetPlayersSeledtor } from 'werewolf/dest/game';
import { UserId } from 'werewolf/dest/user';
import { PlayerId } from 'werewolf/dest/player';
import { Button, Card, CardActions, CardContent, Container, GridList, GridListTile, ListSubheader, MenuItem, Select, Typography } from '@material-ui/core';

const UserView = (prop: { id: UserId }) => {
  const user = useSelector(usersSelector).find(user => user.Id === prop.id);
  return (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          Id: {user?.Id}
        </Typography>
        <Typography variant="h5" component="h2">
          Name: {user?.Name}
        </Typography>
      </CardContent>
    </Card>
  )
}

const PlayerView = (prop: { id: PlayerId, game: Game }) => {
  const player = useSelector(playersSelector).find(player => player.Id === prop.id);
  const votablePlayer = useSelector(votingTargetPlayersSeledtor)
  const [voteSelect, setVoteSelect] = React.useState('');

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setVoteSelect(event.target.value as string);
  };
  return (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          Id: {player?.Id}
        </Typography>
        <Typography variant="h5" component="h2">
          User: {player?.User}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Camp: {player?.Camp}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Position: {player?.Position}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          ComingOut: {player?.CamingOut}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          IsBited: {player?.IsBited?.toString()}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          IsProtected: {player?.IsProtected?.toString()}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          IsVotingTarget: {player?.IsVotingTarget?.toString()}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          IsSurvival: {player?.IsSurvival?.toString()}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          VoteTo: {player?.VoteTo}
        </Typography>
      </CardContent>
      <div>
        vote:
        <Select value={voteSelect}
          onChange={handleChange}>
          {votablePlayer.filter(v=>v.Id !== player?.Id).map(v => (<MenuItem value={v.Id}>{v.Id}</MenuItem>))}
        </Select>
        <Button onClick={() => {
          const target = prop.game.getPlayerByPlayerId(voteSelect)
          if (player != null && target != null) {
            prop.game.getPlayerByUserId(player.User)?.Vote(target)
          }
        }}>Vote</Button>

      </div>
    </Card>
  )
}


function App(prop: { game: Game }) {
  const gameState = useSelector(gameSelector)
  const Users = useSelector(usersSelector).map(user => <GridListTile ><UserView id={user.Id} /></GridListTile>)
  const players = useSelector(playersSelector);
  return (
    <Container>
      <div><button onClick={() => {
        prop.game.TimeOut()
      }
      } >Schedule</button></div>
      <div>Day: {gameState.Days}</div>
      <div>Phase: {gameState.Phase} </div>

      <GridList cols={4} >
        <GridListTile cols={4} style={{ height: 'auto' }}>
          <ListSubheader component="div">Users</ListSubheader>
        </GridListTile>
        {Users}
      </GridList>
      <GridList cols={4} >
        <GridListTile cols={4} style={{ height: 'auto' }}>
          <ListSubheader component="div">Players</ListSubheader>
        </GridListTile>
        {players.map(player => (
          <GridListTile style={{ height: 'auto' }}>
            <PlayerView key={player.Id} game={prop.game} id={player.Id} />
          </GridListTile>
        ))}
      </GridList>
    </Container>
  );
}

export default App;
