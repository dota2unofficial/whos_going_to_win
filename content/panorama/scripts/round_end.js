"use strict"

function RoundEnd(event) {
	const context = $.GetContextPanel()

	context.AddClass("ShowVictory")

	context.RemoveClass("DireWin")
	context.RemoveClass("RadiantWin")
	context.RemoveClass("Win")
	context.RemoveClass("Lose")

	const localPlayerBet = event.bets[Game.GetLocalPlayerID()]
	const isLocalPlayerHasBet = localPlayerBet !== undefined

	if (isLocalPlayerHasBet) {
		if (event.winnerTeam == localPlayerBet.team) {
			context.SetDialogVariable("victory_title", $.Localize("#round_win"))
			context.AddClass("Win")
		}
		else {
			context.SetDialogVariable("victory_title", $.Localize("#round_lose"))
			context.AddClass("Lose")
		}
	}
	else {
		if (event.winnerTeam == "left") {
			context.SetDialogVariable("victory_title", $.Localize("#round_win_left"))
			context.AddClass("RadiantWin")
		}
		else {
			context.SetDialogVariable("victory_title",  $.Localize("#round_win_right"))
			context.AddClass("DireWin")
		}
	}

	GameUI.SetDefaultUIEnabled( DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_PANEL, false );

	UpdateBets(event)

}

function NewRound(event) {
	$.GetContextPanel().RemoveClass("ShowVictory")
}

(function() {
	GameEvents.Subscribe("new_round", NewRound);
	GameEvents.Subscribe("round_end", RoundEnd);
})()