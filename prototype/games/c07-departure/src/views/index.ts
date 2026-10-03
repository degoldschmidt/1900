/**
 * View-model entry points (RULES.md 9). Every view is a pure function of the public state and
 * public data (timetable, public rows, citations, own trail, design values) and returns plain
 * objects with display strings already formatted. The UI imports only from here.
 */
export { publicState, type PublicState, type ViewData } from './public.ts';
export { diaryView, upcomingView, type DiaryViewModel, type UpcomingItem, type SlotView } from './diary.ts';
export { boardView, type BoardViewModel, type BoardRow } from './board.ts';
export { plannerView, type PlannerViewModel, type PlannerOption, type LegView, type ClassOption, type SourceView } from './planner.ts';
export { cityView, type CityViewModel, type VenueView } from './city.ts';
export { shelfView, type ShelfViewModel } from './shelf.ts';
export { purseView, type PurseViewModel } from './purse.ts';
export { commissionsView, type CommissionsViewModel, type OfferView, type StageView } from './commissions.ts';
export { trailView, type TrailRow } from './trail.ts';
export { newsView, type NewsItem } from './news.ts';
export { arrivalView, type ArrivalViewModel } from './arrival.ts';
export { aboutView, PREVIEW_BANNER, type AboutViewModel } from './about.ts';
export { autopsyView, questionnaireView, type AutopsyViewModel, type QuestionView } from './autopsy.ts';
export { actionsView, type ActionView, type ActionPreview, type RecordPreview } from './actions.ts';
export { clock, money, interruptText, type Clock, type CitationView } from './format.ts';
export type { C07Command } from '../commands.ts';
export { mapView, mapGeometry, pathOf, isNight, type MapViewModel, type MapGeometry, type MapCity } from './map.ts';
export { goalView, type GoalViewModel } from './goal.ts';
export { citySheetView, purseLine, type CitySheetViewModel, type DepartureRow, type TownChoice } from './sheet.ts';
export { journeyView, displayClock, type JourneyViewModel } from './journey.ts';
export { cardsSince, marksOf, actOutcome, type Marks, type EventCard, type CardAction, type CardButton } from './cards.ts';
export { pocketView, type PocketViewModel } from './pocket.ts';
export { replayView, type ReplayViewModel } from './autopsy-map.ts';
export { span, poundsWords } from './format.ts';
