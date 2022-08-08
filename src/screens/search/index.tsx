import React, {useCallback, useState} from 'react';
import styled from 'styled-components/native';
import {useSelector} from 'react-redux';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';

import SearchInput from './components/SearchInput';
import SearchRecent, {SearchRecentProps} from './components/SearchRecent';
import VerticalMangaList from 'src/components/VerticalMangaList';
import {CategoryManga, ColorProps} from 'src/shared/Types';
import theme from 'src/shared/theme';
import language from 'src/shared/language';
import {SearchScreenProp} from 'src/navigation/types';
import {RootState, useAppDispatch} from 'src/redux/AppStore';
import {mostPopularMangasThunk} from 'src/redux/actions/CategoryActions';
import SearchResult from './components/SearchResult';
import {searchMangaThunk} from 'src/redux/actions/MangaActions';

export interface SearchProps extends SearchScreenProp {
  mostPopularMangaList: CategoryManga[];
  recents: SearchRecentProps['recents'];
}

// TODO
const recents: SearchRecentProps['recents'] = [
  'search 1',
  'random search 2',
  'Lorem ipsum dolor sit amet, consectetur',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem',
];

// TODO
// 1. ekran değişince search text sıfırlanmıyor. SearchResultItem tıklanırsa sil;
// 2. text yazıp search yapıp text silinirse hala search active olacak. Text '' ise isActive = false;

function Search(props: SearchScreenProp) {
  const {navigation} = props;
  const mostPopulars = useSelector(
    (state: RootState) => state.category.mostPopulars,
  );
  const dispatcher = useAppDispatch();
  const tabBarHeight = useBottomTabBarHeight();
  const [isSearchActive, setIsSearchActive] = useState(false);

  let setSearchRecentVisibility: (isVisible: boolean) => void | undefined;

  const searchText = useCallback(
    (text: string) => {
      if (!isSearchActive) {
        setIsSearchActive(true);
      }
      const page = 1;
      dispatcher(searchMangaThunk(text, page));
    },
    [dispatcher, isSearchActive],
  );

  const onTextClear = useCallback(() => {
    if (isSearchActive) {
      setIsSearchActive(false);
    }
  }, [isSearchActive]);

  const onSearchItemPress = useCallback(() => {
    if (isSearchActive) {
      setIsSearchActive(false);
    }
    // Add to recents
  }, [isSearchActive]);

  const onScrollTop = () => {
    if (setSearchRecentVisibility) {
      setSearchRecentVisibility(true);
    }
  };

  const onScrollBottom = () => {
    if (setSearchRecentVisibility) {
      setSearchRecentVisibility(false);
    }
  };

  if (!mostPopulars || mostPopulars.length === 0) {
    const page = 1;
    dispatcher(mostPopularMangasThunk(page));
  }

  return (
    <Container tabBarHeight={tabBarHeight}>
      <SearchInput searchText={searchText} onTextClear={onTextClear} />
      {isSearchActive && (
        <SearchResult onPress={onSearchItemPress} navigation={navigation} />
      )}
      {!isSearchActive && (
        <SearchRecent
          recents={recents}
          callback={(setter: (isVisible: boolean) => void) =>
            (setSearchRecentVisibility = setter)
          }
        />
      )}
      {!isSearchActive && mostPopulars.length > 0 && (
        <MostPopularMangaTitle color={theme.onView}>
          {language.getText('genre_most_popular')}
        </MostPopularMangaTitle>
      )}
      {!isSearchActive && (
        <VerticalMangaList
          categoryMangaList={mostPopulars}
          scrollHandlers={{onScrollTop, onScrollBottom}}
          navigation={navigation}
        />
      )}
    </Container>
  );
}

interface ContainerProps {
  tabBarHeight: number;
}

const Container = styled.View<ContainerProps>`
  flex: 1;
  padding: 16px 16px ${({tabBarHeight}) => tabBarHeight}px 16px;
`;

const MostPopularMangaTitle = styled.Text<ColorProps>`
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: bold;
  color: ${({color}) => color};
`;

export default Search;
