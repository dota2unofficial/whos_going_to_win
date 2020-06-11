let cur_units = {}
function new_round(t) {
	// $("#leftTeam").text = t.left
	// $("#rightTeam").text = t.right
	$("#pwleft").text = "Power: "+t.left
	$("#pwright").text = "Power: "+t.right
	$("#pwleft").visible = t.left != 0
	$("#pwright").visible = t.right != 0
	$("#makeBetPanel").style.visibility = "visible"
	$("#leftTeamG").RemoveAndDeleteChildren()
	$("#rightTeamG").RemoveAndDeleteChildren()
	cur_units = t.indexes
	for(let k in t.indexes){
		for(let i in t.indexes[k]){
			if(k == "left"){
				// $.CreatePanel("Label", $("#leftTeamG"), "lb").text = $.Localize(Entities.GetUnitName(t.indexes[k][i]))
				// let pan = $.CreatePanel("Panel", $("#leftTeamG"), "lb"),
				createSceneVersus(t,k,i,$("#leftTeamG"))
			}else if(k == "right"){
				// $.CreatePanel("Label", $("#rightTeamG"), "lb").text = $.Localize(Entities.GetUnitName(t.indexes[k][i]))
				// let pan = $.CreatePanel("Panel", $("#rightTeamG"), "lb"),
				createSceneVersus(t,k,i,$("#rightTeamG"))
			}
		}
	}
	$("#leftPct").text = "0%"
	$("#rightPct").text = "0%"
	$("#leftBar").style.width = "50%"
	$("#rightBar").style.width = "50%"
	$("#round").text = ++round

	BetReset()
	$("#BetSlider").SetValueNoEvents(0.5)
	$("#ReadyToRound").checked = false
	$("#ReadyToRound").visible = Players.GetGamblingGold(Game.GetLocalPlayerID()) > 0
	$("#BetContainer").visible = Players.GetGamblingGold(Game.GetLocalPlayerID()) > 0

	$("#topbar").Children().forEach(panel => {
		panel.FindChild("bet").visible = false
		panel.FindChild("profit").visible = false
		panel.RemoveClass("Left")
		panel.RemoveClass("Right")
		panel.SetHasClass("Loser", Players.GetGamblingGold(panel.playerID) <= 0)
	}) 
}
function checkHp() {
	$.Schedule(0.1, checkHp)

	if(Object.keys(cur_units).length){
		let hps = {"left":0,"right":0,"leftmax":0,"rightmax":0}
		for(let k in cur_units){
			if(k != "regens"){
				for(let i in cur_units[k]){
					hps[k] += Entities.GetHealth(cur_units[k][i])
					hps[k+"max"] += Entities.GetMaxHealth(cur_units[k][i])
				}
			}
		}
		$("#leftHpPct").text = hps.left
		$("#rightHpPct").text = hps.right
		$("#lefthp").style.width = Math.round(hps.left/hps.leftmax*100)+"%"
		$("#righthp").style.width = Math.round(hps.right/hps.rightmax*100)+"%"
	}

	const topBar = $("#topbar")
	topBar.Children().forEach(panel => {
		var childID = topBar.GetChildIndex(panel)

		panel.FindChild("gold").text = Players.GetGamblingGold(panel.playerID)

		if (childID > 0) {
			var upperPanel = topBar.GetChild(childID-1)
			
			if (upperPanel && Players.GetGamblingGold(upperPanel.playerID) < Players.GetGamblingGold(panel.playerID) ) {
				topBar.MoveChildAfter(upperPanel, panel)
			}
		}
	})	
}
function createSceneVersus(t,k,i,parent) {
	let pan = $.CreatePanel("Panel", parent, "lb"),
	name = Entities.GetUnitName(t.indexes[k][i]),
	ab,abpan,abname

	const unitID = t.indexes[k][i]
	const isHero = Entities.GetUnitName(unitID).includes("npc_dota_hero")

	pan.BLoadLayoutSnippet("teamScene")
	pan.BCreateChildren('<DOTAScenePanel id="unit" class="teamScene" light="global_light" environment="default" particleonly="false" renderwaterreflections="true" antialias="true" drawbackground="0" renderdeferred="false" unit="'+name+'"/>')
	AddUnitTooltip(pan.FindChildTraverse("unit"),t.indexes[k][i])
	pan.FindChildTraverse("name").text = $.Localize(name)
	pan.FindChildTraverse("unithptext").text = Entities.GetMaxHealth(t.indexes[k][i])
	pan.FindChildTraverse("unitmptext").text = Entities.GetMaxMana(t.indexes[k][i])
 // $.Msg(t.indexes['regens'][t.indexes[k][i]])
	pan.FindChildTraverse("unitdamage").text = t.indexes['regens'][t.indexes[k][i]]["3"]
	pan.FindChildTraverse("unitarmor").text = t.indexes['regens'][t.indexes[k][i]]["4"].toFixed(1)
	pan.FindChildTraverse("unitatkspd").text = t.indexes['regens'][t.indexes[k][i]]["5"].toFixed(2)+"s"
	pan.FindChildTraverse("unitatkrng").text = t.indexes['regens'][t.indexes[k][i]]["6"]

	pan.SetDialogVariableInt("level", Entities.GetLevel(unitID))

	// $.Msg([t.indexes[k][i],Entities.GetHealthThinkRegen(t.indexes[k][i]),Entities.GetManaThinkRegen(t.indexes[k][i])])
	pan.FindChildTraverse("unithpplus").text = FormatRegen(t.indexes['regens'][t.indexes[k][i]]["1"])
	pan.FindChildTraverse("unitmpplus").text = FormatRegen(t.indexes['regens'][t.indexes[k][i]]["2"])
	let abs = pan.FindChildTraverse("abils")
	for (let d = 0; d < 6; d++) {
		const abilityContainer = $.CreatePanel("Panel", abs, "ability"+d)
		abilityContainer.AddClass("AbilityContainer")
		ab = Entities.GetAbility(t.indexes[k][i],d)
		const abpan = $.CreatePanel("DOTAAbilityImage", abilityContainer, "ab")
		abname = Abilities.GetAbilityName(ab)
		// abpan.abilityname = abname
		if (Abilities.IsHidden(ab)) continue;
		abpan.contextEntityIndex = ab
		abpan.SetHasClass("no_level", Abilities.GetLevel(ab) < 1)
		if(ab != -1){
			abpan.SetPanelEvent('onmouseover',ShowAbTooltip(abpan,t.indexes[k][i],abname))
			abpan.SetPanelEvent('onmouseout',function() {
				$.DispatchEvent('DOTAHideAbilityTooltip',abpan);
			})

			if (isHero) {
				pan.AddClass("Hero")
				const levelContainer = $.CreatePanel("Panel", abilityContainer, "AbilityLevelContainer")
				const maxLevel = Abilities.GetMaxLevel(ab)
				const currentLevel = Abilities.GetLevel(ab)

				if (maxLevel > 1 || Abilities.IsOnLearnbar(ab)) {
					for (let i=1; i<=maxLevel; i++) {
						const levelPanel = $.CreatePanel("Panel", levelContainer, "level"+i)
						levelPanel.AddClass("LevelPanel")
						levelPanel.SetHasClass("active_level", i <= currentLevel)
					}
				}

			}
		}
	}
	let items = pan.FindChildTraverse("items"),itm,item 
	for (let d = 0; d < 6; d++) {
		let item = Entities.GetItemInSlot(t.indexes[k][i],d)

		if(item != -1){
			const itemName = Abilities.GetAbilityName(item) 
			itm = items.GetChild(d)
			itm.contextEntityIndex = item
			itm.SetPanelEvent('onmouseover',ShowAbTooltip(itm,t.indexes[k][i],itemName))
			itm.SetPanelEvent('onmouseout',function() {
				$.DispatchEvent('DOTAHideAbilityTooltip',itm);
			})
		}
		// let abpan = $.CreatePanel("DOTAAbilityImage", abs, "ab")
		// abname = Abilities.GetAbilityName(ab)
		// // abpan.abilityname = abname
		// abpan.contextEntityIndex = ab
		
	}

	if (isHero) {
			const talentPanel = $.CreatePanel("Panel", pan, "TalentsDisplay")
			talentPanel.BLoadLayoutSnippet("TalentDisplay")
			const firstTalent = GetHeroFirstTalentID(unitID)
			//$.Msg(firstTalent)

			talentPanel.FindChildTraverse("StatLevelProgressBar").value = Entities.GetLevel(unitID)
			talentPanel.FindChildTraverse("StatLevelProgressBarBlur").value = Entities.GetLevel(unitID)

			if (firstTalent != -1) {
				for (let i = 0; i < 8; i++) {
					if (Abilities.GetLevel(Entities.GetAbility(unitID, firstTalent+i)) > 0) {
						//$.Msg(Abilities.GetAbilityName(Entities.GetAbility(unitID, firstTalent+i)))
						switch (i) {
							case 0:
								talentPanel.FindChildTraverse("StatRow10").AddClass("RightBranchSelected")
								break
							case 1:
								talentPanel.FindChildTraverse("StatRow10").AddClass("LeftBranchSelected")
								break
							case 2:
								talentPanel.FindChildTraverse("StatRow15").AddClass("RightBranchSelected")
								break
							case 3:
								talentPanel.FindChildTraverse("StatRow15").AddClass("LeftBranchSelected")
								break
							case 4:
								talentPanel.FindChildTraverse("StatRow20").AddClass("RightBranchSelected")
								break
							case 5:
								talentPanel.FindChildTraverse("StatRow20").AddClass("LeftBranchSelected")
								break
							case 6:
								talentPanel.FindChildTraverse("StatRow25").AddClass("RightBranchSelected")
								break
							case 7:
								talentPanel.FindChildTraverse("StatRow25").AddClass("LeftBranchSelected")
								break
						}
					}
				}
			}

			talentPanel.SetPanelEvent("onmouseover", function() {
				$.DispatchEvent("UIShowCustomLayoutParametersTooltip", talentPanel, "TalentTooltip", 
					"file://{resources}/layout/custom_game/tooltip_talent.xml", "heroID="+unitID)
			})   

			talentPanel.SetPanelEvent("onmouseout", function() {
				$.DispatchEvent("UIHideCustomLayoutTooltip", talentPanel, "TalentTooltip")      
			})
		}


}
function FormatRegen( regen )
{
	return (regen >= 0 ? "+" : "" ) + regen.toFixed(1);
}
function AddUnitTooltip( panel, unit )
{
	panel.SetPanelEvent("onmouseover", function(){
		$.DispatchEvent( 'UIShowCustomLayoutParametersTooltip', panel, panel.id, "file://{resources}/layout/custom_game/tooltips.xml", "unit="+unit);
	})
	panel.SetPanelEvent("onmouseout", function() {
		$.DispatchEvent("UIHideCustomLayoutTooltip", panel, panel.id)
	})
}
function ShowAbTooltip(panel,ent,abname) {
	return function() {
		$.DispatchEvent('DOTAShowAbilityTooltipForEntityIndex',panel,abname,ent);
	}
}
let round = 0
function change(t) {
	let all = t.left + t.right,
		left = Math.round(t.left/all)* 100,
		right = 100-left
	$("#leftPct").text = `${left}%`
	$("#leftBar").style.width = `${left}%`
	$("#rightPct").text = `${right}%`
	$("#rightBar").style.width = `${right}%`
}

function hide_versus() {
	$("#makeBetPanel").style.visibility = "collapse"
}
function Start() {	
	let ids = Game.GetAllPlayerIDs()
	$("#topbar").RemoveAndDeleteChildren()
	ids.forEach(function(id,_) {
		let plysteamid = Game.GetPlayerInfo(id).player_steamid,
			hero = Players.GetSelectedEntities(id)[0],
			panel = $.CreatePanel("Panel", $("#topbar"), "player_"+id)
		panel.BLoadLayoutSnippet("topBarPlayer")
		panel.FindChildTraverse("image").steamid = plysteamid
		panel.FindChild("gold").text = Players.GetGamblingGold(id)
		panel.playerID = id
	})
}
const timerEl = $("#time")
function timer(t) {
	timerEl.text = t.time
}
GameEvents.Subscribe("new_round",new_round);
GameEvents.Subscribe("change_top",change);
GameEvents.Subscribe("new_timer",timer);
GameEvents.Subscribe("hide_versus",hide_versus);

function UpdateSelectedUnit() {
	let selectedEntity = Players.GetLocalPlayerPortraitUnit(),
		sel = Players.GetSelectedEntities(Players.GetLocalPlayer())[0]
	if(selectedEntity == sel){
		GameUI.SetDefaultUIEnabled( DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_PANEL, false );
	}else{
		GameUI.SetDefaultUIEnabled( DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_PANEL, true );
	}
}
function vote() {
	GameEvents.SendCustomGameEventToServer("speedup",{})
}

function ReadyToRound() {
	GameEvents.SendCustomGameEventToServer("player_ready_to_round", { isReady: $("#ReadyToRound").checked })
}

function GRSChange() {
	if(Game.GetState() == DOTA_GameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS){
		Start()
	}
}
GRSChange()

function UpdateBets(data) {
	let leftGold = 0
	let rightGold = 0

	for (bet in data) {
		if (data[bet].team == "left") {
			leftGold += +data[bet].gold
		}
		else if (data[bet].team == "right") {
			rightGold += +data[bet].gold
		}
	}

	const summ = rightGold + leftGold
	const left = Math.round(leftGold/summ * 100)
	const right = Math.round(rightGold/summ * 100)

	$("#leftPct").text = `(${left}%) ${leftGold}`
	$("#leftBar").style.width = `${left}%`
	$("#rightPct").text = `${rightGold} (${right}%)`
	$("#rightBar").style.width = `${right}%`

	let count = 0
	$("#topbar").Children().forEach(panel => {
		const bet = data[panel.playerID]
		panel.RemoveClass("Left")
		panel.RemoveClass("Right")
		panel.SetHasClass("Loser", Players.GetGamblingGold(panel.playerID) == 0)
		if (bet) {
			let gold = bet.gold
			let profit = 0
			if (bet.team == "left") {
				profit =  gold/leftGold * rightGold
				panel.AddClass("Left")
				panel.FindChildTraverse("TeamIcon").SetImage("file://{images}/custom_game/team_icons/team_icon_horse_01.png")
			}
			else {
				profit =  gold/rightGold * leftGold
				panel.AddClass("Right")
				panel.FindChildTraverse("TeamIcon").SetImage("file://{images}/custom_game/team_icons/team_icon_tiger_01.png")
			}

			profit = profit.toFixed(0)
			
			panel.FindChild("bet").text = `${gold}`
			panel.FindChild("profit").text = `${profit}`
			panel.FindChild("bet").visible = true
			panel.FindChild("profit").visible = true
		}
		else {
			panel.FindChild("bet").visible = false
			panel.FindChild("profit").visible = false

		}
	})

}

function OnBetsChanged(table_name, key, data) {
	if (key == "minimalBet") {
		$("#MinimalBet").SetDialogVariableInt("minimal_bet", data.minimalBet || 0)
	}
	else if (key == "bets") {
		UpdateBets(data)
	}
}

CustomNetTables.SubscribeNetTableListener("bets", OnBetsChanged)

GameEvents.Subscribe("dota_player_update_query_unit",UpdateSelectedUnit)
GameEvents.Subscribe('dota_player_update_hero_selection', UpdateSelectedUnit);
GameEvents.Subscribe('dota_player_update_selected_unit', UpdateSelectedUnit);
GameEvents.Subscribe('game_rules_state_change', GRSChange);

checkHp()

function GetHeroFirstTalentID(heroID) {
	for (let i = 0; i < 24; i++) {
		const abilityName = Abilities.GetAbilityName(Entities.GetAbility(heroID, i))

		if (abilityName.includes("special_bonus"))
			return i
	}

	return -1
}



// [GCClient] Recv msg 26 (k_ESOMsg_UpdateMultiple), 390 bytes
// [PanoramaScript] [0,1]
// [PanoramaScript] !! (panorama\scripts\baw.js, line:116, col:68) - V8ParamToPanoramaType expected Number type to convert, but got something else (undefined)
// [PanoramaScript] !! (panorama\scripts\baw.js, line:116, col:45) - Failed to set property value (property=height)(value=NaN%)
// C:Gamerules: entering state 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS'
// [Client] CDOTA_Hud_Main::EventGameRulesStateChanged DOTA_GAMERULES_STATE_GAME_IN_PROGRESS
// [PanoramaScript] [0,1]
// [PanoramaScript] !! (panorama\scripts\baw.js, line:35, col:8) - TypeError: Cannot read property 'FindChildTraverse' of null
// [GCClient] Recv msg 7273 (k_EMsgGCChatMessage), 221 bytes
// [GCClient] Recv msg 26 (k_ESOMsg_UpdateMultiple), 394 bytes
// [PanoramaScript] {"right":0,"left":1}
// Set target panel parameter "unit" to the value "248"
// Set target panel parameter "unit" to the value "251"
// [PanoramaScript] {"right":1,"left":1}