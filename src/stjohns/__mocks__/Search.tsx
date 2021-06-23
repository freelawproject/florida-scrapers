/*
 * https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search
 */

export const POST_INFO = {
  url: "https://apps.stjohnsclerk.com/Benchmark//CourtCase.aspx/CaseSearch",
  method: "POST",
}

export const POST_HEADERS = {
  ":authority": "apps.stjohnsclerk.com",
  ":method": "POST",
  ":path": "/Benchmark//CourtCase.aspx/CaseSearch",
  ":scheme": "https",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "max-age=0",
  "content-length": "2895",
  "content-type": "application/x-www-form-urlencoded",
  cookie:
    "ASP.NET_SessionId=m5kidfeb54xr2tvptrb2uyy4; __RequestVerificationToken_L0JlbmNobWFyaw2=r8G1CH6oo7AOu9K21sDk3oN2HFFQdvh2R8VK3u2wv6etTWhFIBP7V5w7v6iG6uUfKzFQouL14iL2UJaACp_4eHdE8G6P4ET5pGeSN7vZs9A1",
  dnt: 1,
  origin: "https://apps.stjohnsclerk.com",
  referer: "https://apps.stjohnsclerk.com/Benchmark/Home.aspx/Search",
  "sec-ch-ua": '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
  "sec-ch-ua-mobile": "?0",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": 1,
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36",
}

export const POST_SEARCH = {
  __RequestVerificationToken:
    "rHYCOfHWSIlZ1V4Y4QJLaUr2xwYUIU0f4IU14C5XSuPVkeVBbL3PI1gXSQL4FYdA3X9RXkk9G9SwjfeZx8C6WT-YVtTYH5psOhBxTBky3zc1",
  "g-recaptcha-response":
    "03AGdBq25qDgRGrCQ1MR85h5s17e6dMTk2A2i49qa-yHm-8nvtbPBn8HzTXa2W5JKO7g-nVcKWeudamiziUFcZYejPBohhZ1SaA6hZHtONLuVY-bNvA7neMQf6noP7UJh08PD1yMUphMs1ggIucwFZpBdc1O-JSnVl7aIhXMmysEZtFjO2rzUhez5Q5W9bAkiDbBPQ7tINYBpeQ2-fGq0nniS4jNHErhYS1-dRx3vqVEs67nklhu0n1SZnFkXW3h8CcIXvVHDTiJG9MsrQ1wd7197Nm3H9MzkIc3ePy5XqCUoSpHJjfVpsUY5Gc2pf5vpBVRrOP1xDsILDQQwqPDbTrdbx1KULCU62RE_75L-npp_u28dKJlgaHLITUjf6tZcmpMwZjwsMkUxGY8ObmPLHCe7epv0cCdqrVktiLBJaEZS3fTYaZPa7g54-SCN-uhnTeNVpTkbGGtZ3XPyq4aPcqGvP8ECmWSb9SB06By41jDjnd_0rbMe2zywDAUp4VxwLhJ490IglzLCI",
  type: "Name",
  search: "",
  openedFrom: "06/17/2020",
  openedTo: "06/17/2021",
  closedFrom: "",
  closedTo: "",
  courtTypes: "6,4",
  caseTypes:
    "117,115,425,426,116,118,59,299,240,160,111,113,112,80,81,82,83,119,108,241,354,218,55,295,399,395,392,135,394,398,296,56,46,284,368,126,379,407,216,215,214,88,243,242,89,93,95,94,90,92,91,244,387,318,8,386,322,349,350,351,346,347,348,340,341,342,343,344,345,71,169,172,220,29,331,332,30,28,330,333,245,339,219,272,273,36,276,275,38,43,280,281,44,274,278,277,282,157,176,283,304,64,306,308,67,305,307,66,106,114,104,26,25,22,327,400,389,383,328,23,393,141,384,329,24,27,388,382,401,175,202,336,201,335,200,366,10,428,158,12,320,180,129,319,11,321,109,168,167,230,231,185,227,228,229,221,222,223,224,225,226,233,197,217,107,246,247,248,103,102,98,97,99,101,100,203,204,207,205,208,209,210,213,206,211,212,236,235,234,415,419,416,417,414,337,165,105,334,149,52,291,84,85,86,87,153,178,239,238,237,293,53,54,294,373,155,372,181,338,182,173,79,152,77,76,78,96,396,422,420,130,51,290,309,311,70,69,310,21,18,325,326,19,20,17,324,323,16,132,410,413,411,412,409,250,58,57,298,297,249,271,156,3,314,4,367,316,317,6,7,385,315,5,2,313,370,171,170,47,286,285,45,179,166,252,424,195",
  partyTypes: "1,2,3,4,5",
  divisions:
    "58,5,6,16,9,13,54,53,59,51,60,20,56,28,30,31,10,15,27,57,2,35,12,11,55,1,18,22,23,8,26,61,19,17,4,3,24,25",
  statutes: "",
  partyBirthYear: "",
  partyDOB: "",
  caseStatus: "",
  propertyAddress: "",
  propertyCity: "",
  propertyZip: "",
  propertySubDivision: "",
  lawFirm: "",
  unpaidPrincipleBalanceFrom: "",
  unpaidPrincipleBalanceTo: "",
  electionDemandFrom: "",
  electionDemandTo: "",
  attorneyFileNumber: "",
}
