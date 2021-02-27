import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useSelector } from 'react-redux';
import { Game, gameSelector, playersSelector, survivalPlayersSelector, usersSelector, votingTargetPlayersSeledtor } from 'werewolf/dest/game';
import { UserId } from 'werewolf';
import { Camp, PlayerId, PlayerState, Position } from 'werewolf/dest/player';
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

const VoteControl = (prop: { player?: PlayerState, game: Game }) => {
  const votablePlayer = useSelector(votingTargetPlayersSeledtor)
  const [voteSelect, setVoteSelect] = React.useState('');
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setVoteSelect(event.target.value as string);
  };
  return (
    <div>
      <Select value={voteSelect}
        onChange={handleChange}>
        {votablePlayer.filter(v => v.Id !== prop.player?.Id).map(v => (<MenuItem value={v.Id}>{v.Id}</MenuItem>))}
      </Select>
      <Button onClick={() => {
        const target = prop.game.getPlayerByPlayerId(voteSelect)
        if (prop.player != null && target != null) {
          prop.game.getPlayerByUserId(prop.player.UserId)?.Vote(target)
        }
      }}>Vote</Button>
    </div>
  )
}

const ComingOutControl = (prop: { player?: PlayerState, game: Game }) => {
  const [comingOutSelect, setComingOutSelect] = React.useState<Position | undefined>(undefined);
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setComingOutSelect(event.target.value as Position);
  };
  return (
    <div>
      <Select value={comingOutSelect}
        onChange={handleChange}>
        <MenuItem value={"FortuneTeller" as Position}>{"FortuneTeller" as Position}</MenuItem>
        <MenuItem value={"Psychic" as Position}>{"Psychic" as Position}</MenuItem>
      </Select>
      <Button onClick={() => {
        if (prop.player != null && comingOutSelect !== undefined) {
          prop.game.getPlayerByUserId(prop.player.UserId)?.CamingOut(comingOutSelect)
        }
      }}>ComingOut</Button>
    </div>
  )
}

const BiteControl = (prop: { player?: PlayerState, game: Game }) => {
  const survivalPlayer = useSelector(survivalPlayersSelector)
  const [biteSelect, setBiteSelect] = React.useState('');
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setBiteSelect(event.target.value as string);
  };
  return (
    <div>
      <Select value={biteSelect}
        onChange={handleChange}>
        {survivalPlayer.filter(v => v.Id !== prop.player?.Id && v.Position !== "Werewolf").map(v => (<MenuItem key={v.Id} value={v.Id}>{v.Id}</MenuItem>))}
      </Select>
      <Button onClick={() => {
        const target = prop.game.getPlayerByPlayerId(biteSelect)
        if (prop.player != null && target != null) {
          prop.game.getPlayerByUserId(prop.player.UserId)?.Bite(target)
        }
      }}>Bite</Button>
    </div>
  )
}

const EscortControl = (prop: { player?: PlayerState, game: Game }) => {
  const survivalPlayer = useSelector(survivalPlayersSelector)
  const [escortSelect, setEscortSelect] = React.useState('');
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setEscortSelect(event.target.value as string);
  };
  return (
    <div>
      <Select value={escortSelect}
        onChange={handleChange}>
        {survivalPlayer.filter(v => v.Id !== prop.player?.Id).map(v => (<MenuItem key={v.Id} value={v.Id}>{v.Id}</MenuItem>))}
      </Select>
      <Button onClick={() => {
        const target = prop.game.getPlayerByPlayerId(escortSelect)
        if (prop.player != null && target != null) {
          prop.game.getPlayerByUserId(prop.player.UserId)?.Escort(target)
        }
      }}>Escort</Button>
    </div>
  )
}

const ReportControl = (prop: { player?: PlayerState, game: Game }) => {
  const players = useSelector(playersSelector)
  const [reportTargetSelect, setReportTargetSelect] = React.useState<PlayerId | undefined>(undefined);
  const reportTargetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReportTargetSelect(event.target.value as PlayerId);
  };
  const [reportPositionSelect, setReportPositionSelect] = React.useState<Camp | undefined>(undefined);
  const reportPositionChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReportPositionSelect(event.target.value as Camp);
  };
  return (
    <div>
      <Select value={reportTargetSelect}
        onChange={reportTargetChange}>
        {players.filter(v => v.Id !== prop.player?.Id).map(v => (<MenuItem key={v.Id} value={v.Id}>{v.Id}</MenuItem>))}
      </Select>
      <Select value={reportPositionSelect}
        onChange={reportPositionChange}>
        <MenuItem value={"Werewolf Side" as Camp}>{"Werewolf Side" as Camp}</MenuItem>
        <MenuItem value={"Citizen Side" as Camp}>{"Citizen Side" as Camp}</MenuItem>
      </Select>
      <Button onClick={() => {
        if (reportPositionSelect && reportTargetSelect) {
          const target = prop.game.getPlayerByPlayerId(reportTargetSelect)
          if (prop.player != null && target != null) {
            prop.game.getPlayerByUserId(prop.player.UserId)?.Report({ target: target.Id, camp: reportPositionSelect })
          }
        }
      }}>Report</Button>
    </div>
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
          User: {player?.UserId}
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
      {
        player?.IsSurvival?
      (<>
      <VoteControl player={player} game={prop.game} />
      <ComingOutControl player={player} game={prop.game} />
      { player?.Position === "Werewolf" && <BiteControl player={player} game={prop.game} />}
      { player?.Position === "Knight" && <EscortControl player={player} game={prop.game} />}
      { player?.CamingOut && <ReportControl player={player} game={prop.game} />}</>)
      :<></>
}
    </Card>
  )
}


function App(prop: { game: Game }) {
  const gameState = useSelector(gameSelector)
  const Users = useSelector(usersSelector).map(user => <GridListTile ><UserView key={user.Id} id={user.Id} /></GridListTile>)
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
          <GridListTile key={player.Id} style={{ height: 'auto' }}>
            <PlayerView  game={prop.game} id={player.Id} />
          </GridListTile>
        ))}
      </GridList>
    </Container>
  );
}

export default App;
