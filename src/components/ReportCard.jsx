import { forwardRef } from 'react'
import './ReportCard.css'
import logo from '../assets/dbcc-logo.png'
import {
  IconPeople,
  IconBat,
  IconBall,
  IconGlove,
  IconTrophy,
  IconCrown,
  IconHandshake,
  IconTarget,
  IconMedal,
  IconFaceHappy,
  IconFaceSad,
} from './ReportIcons'

const RANK_MEDAL = ['gold', 'silver', 'bronze']

function Laurel({ side }) {
  return (
    <svg
      className={`laurel laurel-${side}`}
      width="26"
      height="20"
      viewBox="0 0 52 40"
      fill="none"
    >
      <g fill="#f0b429">
        <ellipse cx="46" cy="6" rx="7" ry="3.2" transform="rotate(35 46 6)" />
        <ellipse cx="38" cy="12" rx="7.5" ry="3.3" transform="rotate(25 38 12)" />
        <ellipse cx="29" cy="17" rx="8" ry="3.4" transform="rotate(14 29 17)" />
        <ellipse cx="19" cy="20" rx="8.2" ry="3.4" transform="rotate(2 19 20)" />
        <ellipse cx="9" cy="21" rx="7.5" ry="3.2" transform="rotate(-8 9 21)" />
      </g>
      <path
        d="M2,23 Q24,30 49,4"
        stroke="#f0b429"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ReportCard = forwardRef(function ReportCard(
  {
    ranked,
    battingLeader,
    bowlingLeader,
    fieldingLeader,
    overallLeader,
    monthLabel,
    tillDate,
    matchesPlayed,
    totalPlayers,
    wins,
    losses,
    showWinsLosses,
    customMessage,
  },
  ref,
) {
  const winsNum = Number(wins) || 0
  const lossesNum = Number(losses) || 0
  const gamesPlayed = winsNum + lossesNum
  const winPercent = gamesPlayed > 0 ? Math.round((winsNum / gamesPlayed) * 100) : 0
  const prizeEligible = winPercent > 50

  return (
    <div className="report-card" ref={ref}>
      <div className="report-bg" />
      <div className="brush-stroke brush-main" />
      <div className="brush-stroke brush-accent" />
      <div className="corner-ball" />
      <div className="corner-flourish tr" />
      <div className="corner-flourish br" />

      <div className="report-content">
        <div className="report-header">
          <div className="report-badge">
            <img src={logo} alt="DBCC Logo" className="club-crest-img" />
          </div>
          <div className="report-title-block">
            <h1 className="report-title-main">
              DBCC <span className="accent">{monthLabel.toUpperCase()}</span>
            </h1>
            <div className="report-subtitle">
              <span className="rule" />
              <span className="arrow">→</span> MONTHLY POINT LIST <span className="arrow">←</span>
              <span className="rule right" />
            </div>
            <div className="report-till-pill">
              {'»» '}TILL - {tillDate} (AFTER {matchesPlayed} MATCH
              {Number(matchesPlayed) === 1 ? '' : 'ES'}){' ««'}
            </div>
          </div>
          <div className="report-tagline">
            ONE TEAM
            <br />
            ONE BELIEF
          </div>
        </div>

        <div className="report-stats">
          <div className="stat">
            <span className="icon">
              <IconPeople color="#0b2451" size={17} />
            </span>
            <span className="label">Total Players</span>
            <span className="value">{totalPlayers}</span>
          </div>
          <div className="stat">
            <span className="icon">
              <IconBat color="#0b2451" size={17} />
            </span>
            <span className="label">Matches Played</span>
            <span className="value">{matchesPlayed}</span>
          </div>
        </div>

        <div className="report-body">
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="col-rank">RANK</th>
                  <th className="col-player">PLAYERS</th>
                  <th className="col-bat">
                    BATTING
                    <br />
                    PTS
                  </th>
                  <th className="col-bowl">
                    BOWLING
                    <br />
                    PTS
                  </th>
                  <th className="col-field">
                    FIELDING &amp;
                    <br />
                    DISCIPLINARY PTS
                  </th>
                  <th className="col-total">
                    TOTAL
                    <br />
                    PTS
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => (
                  <tr key={p.id} className={i < 3 ? `rank-${i + 1}` : undefined}>
                    <td className="col-rank">
                      {RANK_MEDAL[i] ? (
                        <span className="rank-medal-icon">
                          <IconMedal tier={RANK_MEDAL[i]} size={22} />
                        </span>
                      ) : (
                        i + 1
                      )}
                    </td>
                    <td className="col-player">{p.name}</td>
                    <td className="col-bat">{p.batting}</td>
                    <td className="col-bowl">{p.bowling}</td>
                    <td className="col-field">{p.fielding}</td>
                    <td className="col-total">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-leaders">
            {showWinsLosses ? (
              <div className="report-winloss">
                <div className="wl-pills-row">
                  <div className="wl-pill">
                    <span className="wl-icon win">✓</span>
                    WINS {wins || 0}
                  </div>
                  <div className="wl-pill">
                    <span className="wl-icon loss">✕</span>
                    LOSSES {losses || 0}
                  </div>
                </div>
                {gamesPlayed > 0 && (
                  <div className={`wl-percent ${prizeEligible ? 'prize' : 'no-prize'}`}>
                    <span className={`wl-face ${prizeEligible ? 'bounce' : 'wobble'}`}>
                      {prizeEligible ? (
                        <IconFaceHappy size={26} />
                      ) : (
                        <IconFaceSad size={26} />
                      )}
                    </span>
                    <div className="wl-percent-text">
                      <div className="wl-percent-value">{winPercent}% Win Rate</div>
                      <div className="wl-percent-note">
                        {prizeEligible ? 'Prize Eligible' : 'No Prize This Month'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="report-leaders-title">
                <Laurel side="left" /> CURRENT LEADERS <Laurel side="right" />
              </div>
            )}

            <div className="leader-card">
              <div className="leader-icon bat">
                <IconBat />
              </div>
              <div className="leader-text">
                <div className="leader-label bat">Batting Leader</div>
                <div className="leader-name">{battingLeader ? battingLeader.name : '—'}</div>
              </div>
              {battingLeader && (
                <div className="leader-pts bat">{battingLeader.batting} PTS</div>
              )}
            </div>

            <div className="leader-card">
              <div className="leader-icon bowl">
                <IconBall />
              </div>
              <div className="leader-text">
                <div className="leader-label bowl">Bowling Leader</div>
                <div className="leader-name">{bowlingLeader ? bowlingLeader.name : '—'}</div>
              </div>
              {bowlingLeader && (
                <div className="leader-pts bowl">{bowlingLeader.bowling} PTS</div>
              )}
            </div>

            <div className="leader-card">
              <div className="leader-icon field">
                <IconGlove />
              </div>
              <div className="leader-text">
                <div className="leader-label field">Fielding &amp; Discipline Leader</div>
                <div className="leader-name">{fieldingLeader ? fieldingLeader.name : '—'}</div>
              </div>
              {fieldingLeader && (
                <div className="leader-pts field">{fieldingLeader.fielding} PTS</div>
              )}
            </div>

            <div className="leader-card">
              <div className="leader-icon overall">
                <IconTrophy />
              </div>
              <div className="leader-text">
                <div className="leader-label overall">Overall Leader</div>
                <div className="leader-name">{overallLeader ? overallLeader.name : '—'}</div>
              </div>
              {overallLeader && (
                <div className="leader-pts overall">{overallLeader.total} PTS</div>
              )}
            </div>

            <div className="report-legend">
              <div className="report-legend-title">★ LEGEND ★</div>
              <ul>
                <li>
                  <span className="legend-icon bat">
                    <IconBat size={11} />
                  </span>
                  Batting Points Topper
                </li>
                <li>
                  <span className="legend-icon bowl">
                    <IconBall size={11} />
                  </span>
                  Bowling Points Topper
                </li>
                <li>
                  <span className="legend-icon field">
                    <IconGlove size={11} />
                  </span>
                  Fielding &amp; Disciplinary Points Topper
                </li>
                <li>
                  <span className="legend-icon overall">
                    <IconTrophy size={11} />
                  </span>
                  Overall Points Topper
                </li>
              </ul>
            </div>

            {customMessage?.trim() && (
              <div className="report-message">{customMessage}</div>
            )}
          </div>
        </div>
      </div>

      <div className="report-footer">
        <div className="values">
          <span>
            <span className="value-icon">
              <IconCrown color="#0b2451" size={11} />
            </span>
            DISCIPLINE
          </span>
          <span className="dot" />
          <span>
            <span className="value-icon">
              <IconHandshake color="#0b2451" size={11} />
            </span>
            BROTHERHOOD
          </span>
          <span className="dot" />
          <span>
            <span className="value-icon">
              <IconTarget color="#0b2451" size={11} />
            </span>
            COMMITMENT
          </span>
          <span className="dot" />
          <span>
            <span className="value-icon">
              <IconTrophy color="#0b2451" size={11} />
            </span>
            VICTORY
          </span>
        </div>
        <div className="tagline">Play for the team. Compete with yourself. Rise with DBCC.</div>
      </div>
    </div>
  )
})

export default ReportCard
