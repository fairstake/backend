const fetch = require('node-fetch');

class SportController {
  constructor() {
    this.API_KEY = '1f0ec8ba5172bdcfc1ffc11614d87f06';
    this.BASE_URL = 'https://api.sportsgameodds.com/v2';
  }

  // Helper method to make API requests
  async makeApiRequest(endpoint) {
    try {
      const requestOptions = {
        method: 'GET',
        headers: { 'X-Api-Key': this.API_KEY }
      };
      
      const response = await fetch(`${this.BASE_URL}${endpoint}`, requestOptions);
      console.log(response)
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error making API request:', error);
      throw error;
    }
  }

  // Get all sports
  async getAllSports(req, res) {
    try {
      const data = await this.makeApiRequest('/sports/');
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch sports data', details: error.message });
    }
  }

  // Get specific sport by ID
  async getSportById(req, res) {
    try {
      const data = await this.makeApiRequest(`/leagues/`);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch sport data', details: error.message });
    }
  }

  // Get leagues for a specific sport
  // async getLeaguesBySport(req, res) {
  //   try {
  //     const { sportID } = req.params;
  //     const data = await this.makeApiRequest(`/leagues/?sportID=${sportID}`);
  //     let Items = data.data
  //     let event = []
  //     const fetchLeague = async (leagueID) => {
  //       const league = await this.makeApiRequest(`/games/?leagueID=${leagueID}`);
  //       return league;
  //     };
  //     Items.forEach(element => {
  //         const league =  fetchLeague(element.leagueID);
  //       event.push(league)
  //     });
    
  //     console.log(event)
  //     return res.status(200).json(data);
  //   } catch (error) {
  //     return res.status(500).json({ error: 'Failed to fetch leagues data', details: error.message });
  //   }
  // }

  // Get leagues for a specific sport with their events
async getLeaguesBySport(req, res) {
  try {
    const { sportID } = req.params;
    
    if (!sportID) {
      return res.status(400).json({ error: 'Sport ID is required' });
    }
    // First, fetch all leagues for the specified sport
    const leaguesResponse = await this.makeApiRequest(`/leagues/?sportID=${sportID}`);
    console.log("leaguesResponse")
    
    if (!leaguesResponse.data || !Array.isArray(leaguesResponse.data)) {
      return res.status(200).json({ leagues: [], events: [] });
    }
    
    const leagues = leaguesResponse.data;

    console.log(leagues)
    
    // // Fetch events for each league in parallel
    // const leagueEventsPromises = leagues.map(async (league) => {
    //   try {
    //     const eventsResponse = await this.makeApiRequest(`/events/?leagueID=${league.leagueID}`);
    //     return {
    //       leagueID: league.leagueID,
    //       events: eventsResponse.data || []
    //     };
    //   } catch (error) {
    //     console.error(`Error fetching events for league ${league.leagueID}:`, error);
    //     return {
    //       leagueID: league.leagueID,
    //       events: [],
    //       error: error.message
    //     };
    //   }
    // });
    
    // // Wait for all event requests to complete
    // const leagueEvents = await Promise.all(leagueEventsPromises);
    
    // // Combine leagues with their events
    // const leaguesWithEvents = leagues.map(league => {
    //   const leagueEventData = leagueEvents.find(item => item.leagueID === league.leagueID);
    //   return {
    //     ...league,
    //     events: leagueEventData ? leagueEventData.events : [],
    //     hasEvents: leagueEventData ? leagueEventData.events.length > 0 : false
    //   };
    // });

    // console.log(leaguesWithEvents)
    
    // return res.status(200).json({
    //   success: true,
    //   sportID,
    //   leagues: leaguesWithEvents,
    //   count: leaguesWithEvents.length
    // });
    
  } catch (error) {
    console.error('Error in getLeaguesBySport:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch leagues data', 
      details: error.message 
    });
  }
}


  // Get games for a specific sport
  async getGamesBySport(req, res) {
    try {
      const { sportId } = req.params;
      const data = await this.makeApiRequest(`/sports/${sportId}/games`);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch games data', details: error.message });
    }
  }

  // Get games for a specific league
  async getGamesByLeague(req, res) {
    try {
      const { leagueId } = req.params;
      const data = await this.makeApiRequest(`/leagues/${leagueId}/games`);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch league games data', details: error.message });
    }
  }

  // Get odds for a specific game
  async getGameOdds(req, res) {
    try {
      const { gameId } = req.params;
      const data = await this.makeApiRequest(`/games/${gameId}/odds`);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch game odds data', details: error.message });
    }
  }

  // Get odds for a specific game
  async getEventGame(req, res) {
    try {
      const { leagueID } = req.params;
      const data = await this.makeApiRequest(`/games/?leagueID=${leagueID}`);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch game odds data', details: error.message });
    }
  }

  // Get live games
  async getLiveGames(req, res) {
    try {
      const data = await this.makeApiRequest('/games/live');
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch live games data', details: error.message });
    }
  }

  // Get upcoming games
  async getUpcomingGames(req, res) {
    try {
      // Optional query parameters
      const { sport, league, limit } = req.query;
      let endpoint = '/games/upcoming';
      
      // Add query parameters if provided
      const queryParams = [];
      if (sport) queryParams.push(`sport=${sport}`);
      if (league) queryParams.push(`league=${league}`);
      if (limit) queryParams.push(`limit=${limit}`);
      
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      const data = await this.makeApiRequest(endpoint);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch upcoming games data', details: error.message });
    }
  }
}

module.exports = SportController;